import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CodeEditor } from '@/components/interview/CodeEditor';
import { OutputConsole } from '@/components/interview/OutputConsole';
import { ChatPanel } from '@/components/interview/ChatPanel';
import { ProblemPanel } from '@/components/interview/ProblemPanel';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Code2, Play, Pause, RotateCcw, ArrowLeft } from 'lucide-react';
import { ChatMessage, CodeTemplate, Participant, CodeExecution } from '@/types';

const DEMO_PROBLEM: CodeTemplate = {
  id: 'demo',
  title: 'Two Sum',
  description: 'Find two numbers that add up to a target',
  problem: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
  examples: `**Example 1:**
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`,
  constraints: `- 2 <= nums.length <= 10^4
- Only one valid answer exists.`,
  starterCode: {
    javascript: '',
    python: '',
    java: '',
    cpp: '',
    go: '',
    ruby: '',
  },
  difficulty: 'easy',
  tags: ['Array', 'Hash Table'],
  createdBy: 'system',
  createdAt: new Date().toISOString(),
};

const DEMO_CODE_SEQUENCE = [
  { delay: 500, code: 'f' },
  { delay: 100, code: 'fu' },
  { delay: 100, code: 'fun' },
  { delay: 100, code: 'func' },
  { delay: 100, code: 'funct' },
  { delay: 100, code: 'functi' },
  { delay: 100, code: 'functio' },
  { delay: 100, code: 'function' },
  { delay: 100, code: 'function ' },
  { delay: 100, code: 'function t' },
  { delay: 100, code: 'function tw' },
  { delay: 100, code: 'function two' },
  { delay: 100, code: 'function twoS' },
  { delay: 100, code: 'function twoSu' },
  { delay: 100, code: 'function twoSum' },
  { delay: 100, code: 'function twoSum(' },
  { delay: 100, code: 'function twoSum(n' },
  { delay: 100, code: 'function twoSum(nu' },
  { delay: 100, code: 'function twoSum(num' },
  { delay: 100, code: 'function twoSum(nums' },
  { delay: 100, code: 'function twoSum(nums,' },
  { delay: 100, code: 'function twoSum(nums, ' },
  { delay: 100, code: 'function twoSum(nums, t' },
  { delay: 100, code: 'function twoSum(nums, ta' },
  { delay: 100, code: 'function twoSum(nums, tar' },
  { delay: 100, code: 'function twoSum(nums, targ' },
  { delay: 100, code: 'function twoSum(nums, targe' },
  { delay: 100, code: 'function twoSum(nums, target' },
  { delay: 100, code: 'function twoSum(nums, target)' },
  { delay: 100, code: 'function twoSum(nums, target) ' },
  { delay: 100, code: 'function twoSum(nums, target) {' },
  { delay: 200, code: 'function twoSum(nums, target) {\n' },
  { delay: 300, code: 'function twoSum(nums, target) {\n  ' },
  { delay: 500, code: `function twoSum(nums, target) {
  // Using a hash map for O(n) solution` },
  { delay: 800, code: `function twoSum(nums, target) {
  // Using a hash map for O(n) solution
  const map = new Map();` },
  { delay: 500, code: `function twoSum(nums, target) {
  // Using a hash map for O(n) solution
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {` },
  { delay: 600, code: `function twoSum(nums, target) {
  // Using a hash map for O(n) solution
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];` },
  { delay: 500, code: `function twoSum(nums, target) {
  // Using a hash map for O(n) solution
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {` },
  { delay: 400, code: `function twoSum(nums, target) {
  // Using a hash map for O(n) solution
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];` },
  { delay: 300, code: `function twoSum(nums, target) {
  // Using a hash map for O(n) solution
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }` },
  { delay: 400, code: `function twoSum(nums, target) {
  // Using a hash map for O(n) solution
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);` },
  { delay: 300, code: `function twoSum(nums, target) {
  // Using a hash map for O(n) solution
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
}` },
  { delay: 800, code: `function twoSum(nums, target) {
  // Using a hash map for O(n) solution
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
}

// Test
console.log(twoSum([2, 7, 11, 15], 9));` },
];

const DEMO_CHAT_MESSAGES: Omit<ChatMessage, 'id' | 'timestamp'>[] = [
  { interviewId: 'demo', userId: 'interviewer', userName: 'Alex (Interviewer)', message: "Hi! Let's start with a classic problem - Two Sum. Have you seen this before?" },
  { interviewId: 'demo', userId: 'candidate', userName: 'Jordan (Candidate)', message: "Hi Alex! Yes, I'm familiar with it. Should I explain my approach first?" },
  { interviewId: 'demo', userId: 'interviewer', userName: 'Alex (Interviewer)', message: "Yes please, walk me through your thought process." },
  { interviewId: 'demo', userId: 'candidate', userName: 'Jordan (Candidate)', message: "I'll use a hash map to achieve O(n) time complexity. For each number, I check if its complement exists." },
  { interviewId: 'demo', userId: 'interviewer', userName: 'Alex (Interviewer)', message: "Great approach! Go ahead and implement it." },
  { interviewId: 'demo', userId: 'candidate', userName: 'Jordan (Candidate)', message: "Perfect, let me code that up..." },
  { interviewId: 'demo', userId: 'interviewer', userName: 'Alex (Interviewer)', message: "Nice solution! The time complexity is O(n) and space is also O(n). Can you run it to verify?" },
  { interviewId: 'demo', userId: 'candidate', userName: 'Jordan (Candidate)', message: "Running now... Output: [0, 1] - correct! nums[0] + nums[1] = 2 + 7 = 9" },
];

export default function Demo() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [codeIndex, setCodeIndex] = useState(0);
  const [chatIndex, setChatIndex] = useState(0);
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [output, setOutput] = useState<CodeExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const participants: Participant[] = [
    { id: 'interviewer', name: 'Alex (Interviewer)', role: 'interviewer', isOnline: true, cursorColor: '#00d9ff' },
    { id: 'candidate', name: 'Jordan (Candidate)', role: 'candidate', isOnline: true, cursorColor: '#a855f7' },
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const runDemo = () => {
      // Progress code
      if (codeIndex < DEMO_CODE_SEQUENCE.length) {
        const current = DEMO_CODE_SEQUENCE[codeIndex];
        timeoutRef.current = setTimeout(() => {
          setCode(current.code);
          setCodeIndex(prev => prev + 1);
        }, current.delay);
      }

      // Progress chat (slower pace)
      if (chatIndex < DEMO_CHAT_MESSAGES.length) {
        const chatDelay = 3000 + Math.random() * 2000;
        setTimeout(() => {
          if (isPlaying && chatIndex < DEMO_CHAT_MESSAGES.length) {
            const msg = DEMO_CHAT_MESSAGES[chatIndex];
            setMessages(prev => [...prev, {
              ...msg,
              id: `msg-${chatIndex}`,
              timestamp: new Date().toISOString(),
            }]);
            setChatIndex(prev => prev + 1);
          }
        }, chatDelay * (chatIndex + 1));
      }

      // Show output when code is complete
      if (codeIndex === DEMO_CODE_SEQUENCE.length - 1) {
        setTimeout(() => {
          setOutput({
            output: '[0, 1]',
            executionTime: 12,
          });
        }, 1500);
      }
    };

    runDemo();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, codeIndex, chatIndex]);

  const handleReset = () => {
    setIsPlaying(false);
    setCodeIndex(0);
    setChatIndex(0);
    setCode('');
    setMessages([]);
    setOutput(null);
    setTimeout(() => setIsPlaying(true), 100);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    await new Promise(r => setTimeout(r, 500));
    setOutput({
      output: '[0, 1]',
      executionTime: 12,
    });
    setIsRunning(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="font-bold hidden sm:inline">
              Code<span className="text-primary">View</span>
            </span>
          </Link>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
              DEMO MODE
            </span>
            <h1 className="font-medium hidden sm:block">Live Interview Simulation</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isPlaying ? 'secondary' : 'glow'}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Play
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button variant="glow" size="sm" asChild>
            <Link to="/auth?mode=signup">Try It Free</Link>
          </Button>
        </div>
      </header>

      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 px-4 py-2 text-center text-sm">
        <span className="text-muted-foreground">
          Watch a simulated interview in action • 
        </span>
        <span className="text-primary font-medium ml-1">
          Code types automatically, chat messages appear in real-time
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Problem */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            <div className="h-full p-2">
              <ProblemPanel template={DEMO_PROBLEM} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel - Code Editor */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col p-2 gap-2">
              <div className="flex-1 min-h-0">
                <CodeEditor
                  code={code}
                  language="javascript"
                  onChange={setCode}
                  participants={participants}
                  theme="vs-dark"
                />
              </div>
              <div className="h-[200px] flex-shrink-0">
                <OutputConsole
                  onRun={handleRunCode}
                  output={output}
                  isRunning={isRunning}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Chat */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
            <div className="h-full p-2">
              <ChatPanel
                messages={messages}
                onSendMessage={() => {}}
                isTyping={{}}
                onTyping={() => {}}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
