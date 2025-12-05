import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useTemplateStore } from '@/stores/templateStore';
import { ProgrammingLanguage, CodeTemplate } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  FileCode, 
  Edit2, 
  Trash2,
  Search,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Templates() {
  const { user, isAuthenticated } = useAuthStore();
  const { templates, addTemplate, updateTemplate, deleteTemplate, getTemplatesByUser } = useTemplateStore();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CodeTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [problem, setProblem] = useState('');
  const [examples, setExamples] = useState('');
  const [constraints, setConstraints] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [tags, setTags] = useState('');
  const [starterCode, setStarterCode] = useState('');

  if (!isAuthenticated || !user) {
    navigate('/auth');
    return null;
  }

  if (user.role !== 'interviewer') {
    navigate('/dashboard');
    return null;
  }

  const userTemplates = getTemplatesByUser(user.id);
  
  const filteredTemplates = userTemplates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty = filterDifficulty === 'all' || t.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setProblem('');
    setExamples('');
    setConstraints('');
    setDifficulty('easy');
    setTags('');
    setStarterCode('');
    setEditingTemplate(null);
  };

  const handleOpenEdit = (template: CodeTemplate) => {
    setEditingTemplate(template);
    setTitle(template.title);
    setDescription(template.description);
    setProblem(template.problem);
    setExamples(template.examples);
    setConstraints(template.constraints);
    setDifficulty(template.difficulty);
    setTags(template.tags.join(', '));
    setStarterCode(template.starterCode.javascript);
    setIsCreateOpen(true);
  };

  const handleSave = () => {
    if (!title.trim() || !problem.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    const templateData = {
      title: title.trim(),
      description: description.trim(),
      problem: problem.trim(),
      examples: examples.trim(),
      constraints: constraints.trim(),
      difficulty,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      starterCode: {
        javascript: starterCode,
        python: starterCode,
      } as Record<ProgrammingLanguage, string>,
      createdBy: user.id,
    };

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, templateData);
      toast.success('Template updated');
    } else {
      addTemplate(templateData);
      toast.success('Template created');
    }

    setIsCreateOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    toast.success('Template deleted');
  };

  return (
    <Layout>
      <div className="container py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Interview Templates</h1>
            <p className="text-muted-foreground">
              Create and manage coding problems for your interviews
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="glow" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
                <DialogDescription>
                  Define a coding problem for your interviews
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Two Sum"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of the problem"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem">Problem Statement *</Label>
                  <Textarea
                    id="problem"
                    placeholder="Describe the problem in detail. Markdown supported."
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examples">Examples</Label>
                  <Textarea
                    id="examples"
                    placeholder="Provide input/output examples"
                    value={examples}
                    onChange={(e) => setExamples(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="constraints">Constraints</Label>
                  <Textarea
                    id="constraints"
                    placeholder="List any constraints (e.g., array size limits)"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., Array, Hash Table, Two Pointers"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="starterCode">Starter Code (JavaScript)</Label>
                  <Textarea
                    id="starterCode"
                    placeholder="function solution(input) {\n  // Your code here\n}"
                    value={starterCode}
                    onChange={(e) => setStarterCode(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button variant="glow" onClick={handleSave}>
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery || filterDifficulty !== 'all'
                  ? 'No templates match your filters'
                  : 'No templates yet. Create your first one!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="hover:border-primary/50 transition-colors group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{template.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0",
                      template.difficulty === 'easy' && 'bg-success/20 text-success',
                      template.difficulty === 'medium' && 'bg-warning/20 text-warning',
                      template.difficulty === 'hard' && 'bg-destructive/20 text-destructive'
                    )}>
                      {template.difficulty}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground">
                        +{template.tags.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {template.createdBy !== 'system' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(template)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {template.createdBy === 'system' && (
                      <span className="text-xs text-muted-foreground">System template</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
