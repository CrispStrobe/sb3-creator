# Load a program using a program

Start from fixed cell 00. The input strip builds a loader, installs an addition program, then supplies 035.

Start at 00 with only the fixed word 001. The first two inputs place INP 02 in cell 01 and JMP 00 in cell 02. Each subsequent address-word/data pair installs one payload word. The word 820 finally replaces cell 01 with JMP 20. The remaining input 035 enters the installed program, which adds the stored 007 and outputs 042. Follow writes to cells 01, 02, 20 through 25, 81 and 99. The input strip contains both loading instructions and program data; their role depends on execution order.

This original exercise uses a decimal educational machine. It is not a generic Scratch, Python, JavaScript or C compilation target.
