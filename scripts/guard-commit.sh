#!/usr/bin/env bash
#
# Refuse a commit that would revert somebody else's pushed work.
#
# This exists because it happened, twice in one morning, in this repo. The shape
# is always the same and it is invisible while you do it:
#
#   1. several sessions share one checkout;
#   2. yours has files on disk from before their commits landed;
#   3. you `git fetch` and realign HEAD *without* updating the tree
#      (`git reset --mixed`, the trap: HEAD moves, the working tree does not);
#   4. `git status` now shows THEIR committed work as YOUR uncommitted changes;
#   5. `git add -A && git commit` reverts it, and the diff looks like your work.
#
# Nothing warns you. The commit is green, the build passes — the reverted thing
# was a bundled extension losing seven opcodes and a WASM pin going back to a
# crashing build, neither of which any test covered. It was found by a human
# reading a diff two hours later.
#
# So: this refuses the commit and says which file and how much. Overriding is one
# environment variable, because sometimes a large deletion IS the change.
#
#   scripts/guard-commit.sh              # check the staged set
#   ALLOW_SHRINK=1 scripts/guard-commit.sh   # yes, I really am deleting that
#
# Install as a hook (once per clone):
#   git config core.hooksPath scripts/hooks
set -u

RED=$'\033[31m'; YEL=$'\033[33m'; OFF=$'\033[0m'
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo HEAD)
upstream="origin/${branch}"
problems=0

git rev-parse --verify --quiet "$upstream" >/dev/null || exit 0   # no upstream: nothing to protect

# ---- 1. behind the remote -------------------------------------------------
# Committing while behind is not itself wrong, but every instance of the bug
# above started here, so it is worth a word.
behind=$(git rev-list --count "HEAD..$upstream" 2>/dev/null || echo 0)
if [ "$behind" -gt 0 ]; then
    echo "${YEL}note${OFF}  ${branch} is ${behind} commit(s) behind ${upstream}."
    echo "      Realign with 'git pull --rebase' or 'git reset --hard ${upstream}'"
    echo "      — NOT 'git reset --mixed', which moves HEAD and leaves the tree stale."
fi

# ---- 2. staged changes that shrink a file sharply -------------------------
# The signature of a stale-tree revert: the staged content is an OLDER version,
# so it deletes far more than it adds.
while IFS=$'\t' read -r added removed path; do
    [ -z "${path:-}" ] && continue
    if [ "$added" = "-" ]; then                     # binary
        continue
    fi
    # ignore small files and small edits; the failure mode is losing a chunk
    if [ "$removed" -ge 25 ] && [ "$removed" -gt $(( added * 3 )) ]; then
        echo "${RED}refusing${OFF}  ${path}: −${removed} +${added}"
        problems=$((problems + 1))
    fi
done < <(git diff --cached --numstat)

# ---- 3. a tracked file staged for deletion --------------------------------
while IFS= read -r path; do
    [ -z "$path" ] && continue
    echo "${RED}refusing${OFF}  ${path}: staged for deletion"
    problems=$((problems + 1))
done < <(git diff --cached --name-only --diff-filter=D)

# ---- 4. binaries that go backwards ----------------------------------------
# A vendored .wasm reverting to an older build is the case no line count sees.
while IFS= read -r path; do
    case "$path" in
        *.wasm|*.hex|*.bin|*.ihx) ;;
        *) continue ;;
    esac
    old=$(git cat-file -s "$upstream:$path" 2>/dev/null || echo 0)
    new=$(git cat-file -s ":$path" 2>/dev/null || echo 0)
    if [ "$old" != "0" ] && [ "$new" != "$old" ]; then
        echo "${YEL}check${OFF}  ${path}: binary differs from ${upstream} (${old} → ${new} bytes)."
        echo "         If this is a re-vendor, the pin and the expected hash must move with it."
    fi
done < <(git diff --cached --name-only)

if [ "$problems" -gt 0 ] && [ "${ALLOW_SHRINK:-0}" != "1" ]; then
    cat <<'WHY'

This is the shape of a commit made from a stale working tree — it deletes far
more than it adds. If that is genuinely the change you mean, say so:

    ALLOW_SHRINK=1 git commit …

If it is not, your tree is older than the branch. Do NOT commit. Recover with:

    git fetch origin
    git status --porcelain          # anything here that you did not write?
    git reset --hard origin/<branch>    # tree AND head, together

and redo your work on top. Stage explicit paths rather than `git add -A` in a
checkout other sessions share.
WHY
    exit 1
fi
exit 0
