import { create } from 'zustand';
import { CodeTemplate, ProgrammingLanguage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface TemplateState {
  templates: CodeTemplate[];
  addTemplate: (template: Omit<CodeTemplate, 'id' | 'createdAt'>) => CodeTemplate;
  updateTemplate: (id: string, updates: Partial<CodeTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => CodeTemplate | undefined;
  getTemplatesByUser: (userId: string) => CodeTemplate[];
}

// Pre-populated templates
const initialTemplates: CodeTemplate[] = [
  {
    id: 'template-1',
    title: 'Two Sum',
    description: 'Find two numbers that add up to a target',
    problem: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: `**Example 1:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\``,
    constraints: `- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
    starterCode: {
      javascript: `function twoSum(nums, target) {
    // Your code here
}`,
      python: `def two_sum(nums, target):
    # Your code here
    pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
    }
};`,
      go: `func twoSum(nums []int, target int) []int {
    // Your code here
}`,
      ruby: `def two_sum(nums, target)
    # Your code here
end`,
    },
    difficulty: 'easy',
    tags: ['Array', 'Hash Table'],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'template-2',
    title: 'Valid Parentheses',
    description: 'Determine if the input string has valid parentheses',
    problem: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: `**Example 1:**
\`\`\`
Input: s = "()"
Output: true
\`\`\`

**Example 2:**
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

**Example 3:**
\`\`\`
Input: s = "(]"
Output: false
\`\`\``,
    constraints: `- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'`,
    starterCode: {
      javascript: `function isValid(s) {
    // Your code here
}`,
      python: `def is_valid(s):
    # Your code here
    pass`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Your code here
    }
}`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        // Your code here
    }
};`,
      go: `func isValid(s string) bool {
    // Your code here
}`,
      ruby: `def is_valid(s)
    # Your code here
end`,
    },
    difficulty: 'easy',
    tags: ['String', 'Stack'],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'template-3',
    title: 'Merge Two Sorted Lists',
    description: 'Merge two sorted linked lists',
    problem: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.`,
    examples: `**Example 1:**
\`\`\`
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]
\`\`\`

**Example 2:**
\`\`\`
Input: list1 = [], list2 = []
Output: []
\`\`\``,
    constraints: `- The number of nodes in both lists is in the range [0, 50].
- -100 <= Node.val <= 100
- Both list1 and list2 are sorted in non-decreasing order.`,
    starterCode: {
      javascript: `function mergeTwoLists(list1, list2) {
    // Your code here
}`,
      python: `def merge_two_lists(list1, list2):
    # Your code here
    pass`,
      java: `class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        // Your code here
    }
}`,
      cpp: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        // Your code here
    }
};`,
      go: `func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
    // Your code here
}`,
      ruby: `def merge_two_lists(list1, list2)
    # Your code here
end`,
    },
    difficulty: 'easy',
    tags: ['Linked List', 'Recursion'],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'template-4',
    title: 'Longest Substring Without Repeating Characters',
    description: 'Find the length of the longest substring without repeating characters',
    problem: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    examples: `**Example 1:**
\`\`\`
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
\`\`\`

**Example 2:**
\`\`\`
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.
\`\`\`

**Example 3:**
\`\`\`
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
\`\`\``,
    constraints: `- 0 <= s.length <= 5 * 10^4
- s consists of English letters, digits, symbols and spaces.`,
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {
    // Your code here
}`,
      python: `def length_of_longest_substring(s):
    # Your code here
    pass`,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Your code here
    }
}`,
      cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Your code here
    }
};`,
      go: `func lengthOfLongestSubstring(s string) int {
    // Your code here
}`,
      ruby: `def length_of_longest_substring(s)
    # Your code here
end`,
    },
    difficulty: 'medium',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
];

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: initialTemplates,

  addTemplate: (templateData) => {
    const template: CodeTemplate = {
      ...templateData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      templates: [...state.templates, template],
    }));

    return template;
  },

  updateTemplate: (id, updates) => {
    set(state => ({
      templates: state.templates.map(t => 
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  deleteTemplate: (id) => {
    set(state => ({
      templates: state.templates.filter(t => t.id !== id),
    }));
  },

  getTemplateById: (id) => {
    return get().templates.find(t => t.id === id);
  },

  getTemplatesByUser: (userId) => {
    return get().templates.filter(t => t.createdBy === userId || t.createdBy === 'system');
  },
}));
