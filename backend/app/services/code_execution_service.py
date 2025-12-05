import asyncio
import random
from typing import Dict
from app.models.interview import ProgrammingLanguage


async def mock_code_execution(
    code: str, language: ProgrammingLanguage, stdin: str = ""
) -> Dict:
    """
    Mock code execution service - mimics frontend mock behavior
    In production, this would call a sandboxed code execution service
    """
    # Simulate network delay
    await asyncio.sleep(random.uniform(0.5, 1.5))

    # Check for common errors
    error = detect_errors(code, language)
    if error:
        return {"output": "", "error": error, "execution_time": random.randint(50, 200)}

    # Generate mock output
    output = generate_mock_output(code, language)

    return {
        "output": output,
        "error": None,
        "execution_time": random.randint(50, 300),
    }


def detect_errors(code: str, language: ProgrammingLanguage) -> str | None:
    """Detect simple syntax errors in code"""
    if len(code.strip()) < 10:
        return "Error: No executable code found"

    error_checks = {
        ProgrammingLanguage.JAVASCRIPT: lambda: check_javascript_errors(code),
        ProgrammingLanguage.PYTHON: lambda: check_python_errors(code),
    }

    checker = error_checks.get(language)
    return checker() if checker else None


def check_javascript_errors(code: str) -> str | None:
    if "cosole.log" in code:
        return "ReferenceError: cosole is not defined"
    if code.count("{") != code.count("}"):
        return "SyntaxError: Unexpected end of input"
    if code.count("(") != code.count(")"):
        return "SyntaxError: Unexpected token"
    return None


def check_python_errors(code: str) -> str | None:
    if "pirnt(" in code:
        return "NameError: name 'pirnt' is not defined"
    return None


def generate_mock_output(code: str, language: ProgrammingLanguage) -> str:
    """Generate mock output based on code patterns"""
    import re

    patterns = {
        ProgrammingLanguage.JAVASCRIPT: [
            (r'console\.log\(["\'](.+?)["\']\)', r"\1"),
            (r"console\.log\((.+?)\)", r"\1"),
        ],
        ProgrammingLanguage.PYTHON: [
            (r'print\(["\'](.+?)["\']\)', r"\1"),
            (r"print\((.+?)\)", r"\1"),
        ],
    }

    output_lines = []
    lang_patterns = patterns.get(language, [])

    for pattern, replacement in lang_patterns:
        matches = re.finditer(pattern, code)
        for match in matches:
            value = match.group(1)
            if "Hello" in value:
                output_lines.append("Hello, World!")
            else:
                output_lines.append(value)

    if not output_lines:
        return random.choice(
            ["Program executed successfully", "No output", "Execution completed"]
        )

    return "\n".join(output_lines)
