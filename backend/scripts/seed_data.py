import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from uuid import uuid4
from app.database import SessionLocal, init_db
from app.models.user import User, UserRole
from app.models.template import CodeTemplate, Difficulty
from app.utils.security import get_password_hash


def seed_users():
    """Create demo users"""
    db = SessionLocal()

    users = [
        {
            "id": "demo-interviewer",
            "email": "interviewer@demo.com",
            "password_hash": get_password_hash("demo123"),
            "name": "Alex Chen",
            "role": UserRole.INTERVIEWER,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
        },
        {
            "id": "demo-candidate",
            "email": "candidate@demo.com",
            "password_hash": get_password_hash("demo123"),
            "name": "Jordan Smith",
            "role": UserRole.CANDIDATE,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
        },
        {
            "id": "system",
            "email": "system@codeview.com",
            "password_hash": get_password_hash("system"),
            "name": "System",
            "role": UserRole.INTERVIEWER,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=system",
        },
    ]

    for user_data in users:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(**user_data)
            db.add(user)

    db.commit()
    print(f"✓ Created {len(users)} demo users")
    db.close()


def seed_templates():
    """Create system templates"""
    db = SessionLocal()

    templates = [
        {
            "id": "template-1",
            "title": "Two Sum",
            "description": "Find two numbers that add up to a target",
            "problem": """Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.""",
            "examples": """**Example 1:**
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
```

**Example 2:**
```
Input: nums = [3,2,4], target = 6
Output: [1,2]
```""",
            "constraints": """- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.""",
            "starter_code": {
                "javascript": "function twoSum(nums, target) {\n    // Your code here\n}",
                "python": "def two_sum(nums, target):\n    # Your code here\n    pass",
            },
            "difficulty": Difficulty.EASY,
            "tags": ["Array", "Hash Table"],
            "created_by": "system",
        },
        {
            "id": "template-2",
            "title": "Valid Parentheses",
            "description": "Determine if the input string has valid parentheses",
            "problem": """Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.""",
            "examples": """**Example 1:**
```
Input: s = "()"
Output: true
```

**Example 2:**
```
Input: s = "()[]{}"
Output: true
```

**Example 3:**
```
Input: s = "(]"
Output: false
```""",
            "constraints": """- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'""",
            "starter_code": {
                "javascript": "function isValid(s) {\n    // Your code here\n}",
                "python": "def is_valid(s):\n    # Your code here\n    pass",
            },
            "difficulty": Difficulty.EASY,
            "tags": ["String", "Stack"],
            "created_by": "system",
        },
        {
            "id": "template-3",
            "title": "Reverse Linked List",
            "description": "Reverse a singly linked list",
            "problem": """Given the `head` of a singly linked list, reverse the list, and return the reversed list.""",
            "examples": """**Example 1:**
```
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
```

**Example 2:**
```
Input: head = [1,2]
Output: [2,1]
```

**Example 3:**
```
Input: head = []
Output: []
```""",
            "constraints": """- The number of nodes in the list is the range [0, 5000]
- -5000 <= Node.val <= 5000""",
            "starter_code": {
                "javascript": "function reverseList(head) {\n    // Your code here\n}",
                "python": "def reverse_list(head):\n    # Your code here\n    pass",
            },
            "difficulty": Difficulty.EASY,
            "tags": ["Linked List", "Recursion"],
            "created_by": "system",
        },
    ]

    for template_data in templates:
        existing = (
            db.query(CodeTemplate).filter(CodeTemplate.id == template_data["id"]).first()
        )
        if not existing:
            template = CodeTemplate(**template_data)
            db.add(template)

    db.commit()
    print(f"✓ Created {len(templates)} system templates")
    db.close()


def main():
    """Run all seed functions"""
    print("Initializing database...")
    init_db()

    print("\nSeeding data...")
    seed_users()
    seed_templates()

    print("\n✓ Database seeded successfully!")
    print("\nDemo Users:")
    print("  Interviewer: interviewer@demo.com / demo123")
    print("  Candidate: candidate@demo.com / demo123")


if __name__ == "__main__":
    main()
