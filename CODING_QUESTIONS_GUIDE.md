# Coding Questions Feature Guide

## Overview
The coding questions feature allows teachers to create programming challenges with automated test case validation. Students can write code in C, C++, Java, or Python, test their solutions, and submit when ready.

## Features

### For Teachers
- **Create Coding Questions**: Add programming problems with detailed descriptions
- **Test Cases**: Define multiple test cases with input/output validation
- **Multiple Languages**: Support for C, C++, Java, and Python
- **Difficulty Levels**: Easy, Medium, Hard classification
- **Time & Memory Limits**: Configure execution constraints
- **Sample I/O**: Provide examples to help students understand

### For Students
- **Multi-Language Support**: Choose from C, C++, Java, or Python
- **Live Code Editor**: Syntax-highlighted editor with language templates
- **Test & Run**: Execute code with custom input or test cases
- **Real-time Feedback**: See test results immediately
- **Submit Solution**: Submit when all test cases pass

## How to Use

### Creating Coding Questions (Teachers)

1. **Navigate to Exam Creation**
   - Go to Admin Dashboard → Create Exam
   - Click "Add Coding Question" button

2. **Fill Question Details**
   ```
   Title: Two Sum Problem
   Description: Given an array of integers and a target sum, return indices of two numbers that add up to target
   Difficulty: Medium
   Points: 15
   Time Limit: 30 seconds
   Memory Limit: 256 MB
   ```

3. **Add Sample Input/Output**
   ```
   Sample Input:
   [2,7,11,15]
   9
   
   Sample Output:
   [0,1]
   ```

4. **Create Test Cases**
   - Add multiple test cases with input and expected output
   - Mark some as "Public" (visible to students for testing)
   - Keep others private for final validation

### Taking Coding Tests (Students)

1. **Start the Exam**
   - Navigate to available assessments
   - Click on exam with coding questions

2. **Solve Coding Problems**
   - Read problem description and constraints
   - Choose programming language (Python, Java, C, C++)
   - Write solution in the code editor

3. **Test Your Code**
   - Use "Run" button to test with custom input
   - Use "Test" button to run against public test cases
   - Fix any issues based on feedback

4. **Submit Solution**
   - Click "Submit Solution" when satisfied
   - Move to next question or submit entire exam

## Language Templates

### Python
```python
# Write your solution here
def solution():
    # Your code here
    pass

# Call your function
solution()
```

### Java
```java
public class Solution {
    public static void main(String[] args) {
        // Write your solution here
        
    }
}
```

### C
```c
#include <stdio.h>

int main() {
    // Write your solution here
    
    return 0;
}
```

### C++
```cpp
#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}
```

## System Requirements

### Backend Dependencies
- **Python**: For Python code execution
- **Java JDK**: For Java compilation and execution
- **GCC**: For C compilation
- **G++**: For C++ compilation

### Installation Commands (Windows)
```bash
# Install Python
winget install Python.Python.3

# Install Java JDK
winget install Oracle.JDK.17

# Install MinGW for GCC/G++
winget install mingw
```

### Verification
```bash
python --version
java --version
gcc --version
g++ --version
```

## Security Features

- **Sandboxed Execution**: Code runs in isolated environment
- **Time Limits**: Prevents infinite loops
- **Memory Limits**: Prevents memory exhaustion
- **File System Isolation**: No access to system files
- **Automatic Cleanup**: Temporary files removed after execution

## API Endpoints

### Execute Code
```http
POST /api/compiler/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "print('Hello World')",
  "language": "python",
  "input": "",
  "testCases": [
    {
      "input": "",
      "expectedOutput": "Hello World"
    }
  ]
}
```

### Response Format
```json
{
  "success": true,
  "results": [
    {
      "input": "",
      "expectedOutput": "Hello World",
      "actualOutput": "Hello World",
      "error": null,
      "executionTime": 45.2,
      "passed": true
    }
  ],
  "allPassed": true,
  "totalTests": 1,
  "passedTests": 1
}
```

## Best Practices

### For Teachers
1. **Clear Problem Statements**: Write detailed, unambiguous descriptions
2. **Comprehensive Test Cases**: Cover edge cases and boundary conditions
3. **Reasonable Limits**: Set appropriate time and memory constraints
4. **Sample Examples**: Always provide sample input/output
5. **Difficulty Progression**: Start with easier problems

### For Students
1. **Read Carefully**: Understand problem requirements and constraints
2. **Test Thoroughly**: Use both custom input and provided test cases
3. **Handle Edge Cases**: Consider empty inputs, large numbers, etc.
4. **Optimize When Needed**: Consider time complexity for harder problems
5. **Clean Code**: Write readable, well-structured solutions

## Troubleshooting

### Common Issues

1. **Compilation Errors**
   - Check syntax and language-specific requirements
   - Ensure proper imports and includes

2. **Runtime Errors**
   - Handle input/output format correctly
   - Check for division by zero, array bounds, etc.

3. **Time Limit Exceeded**
   - Optimize algorithm complexity
   - Avoid infinite loops

4. **Wrong Answer**
   - Verify logic against sample cases
   - Check output format (spaces, newlines)

### System Issues

1. **Compiler Not Found**
   - Ensure required compilers are installed
   - Check system PATH variables

2. **Permission Errors**
   - Run backend with appropriate permissions
   - Check temp directory access

## Future Enhancements

- **More Languages**: Support for JavaScript, Go, Rust
- **Interactive Debugging**: Step-through debugging capabilities
- **Code Analysis**: Static analysis and suggestions
- **Plagiarism Detection**: Compare solutions for similarity
- **Performance Metrics**: Detailed execution statistics