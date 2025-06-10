import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertCodeSnippetSchema, InsertCodeSnippet } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/simplified-auth';
import { Loader2, Save, Copy, Download, Trash, Play, Check, FolderOpen } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// For demo purposes, we'll use a simple monaco-editor style component
function MockMonacoEditor({ value, onChange, language }: { value: string; onChange: (value: string) => void; language: string }) {
  return (
    <div className="min-h-[400px] border rounded-md p-4 font-mono bg-neutral-900 text-white overflow-auto">
      <textarea
        className="w-full h-[380px] resize-none bg-transparent focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}

// In a real app, we would use Monaco Editor
// import Editor from '@monaco-editor/react';
// function MonacoEditor({ value, onChange, language }) {
//   return (
//     <Editor
//       height="400px"
//       language={language}
//       value={value}
//       onChange={onChange}
//       theme="vs-dark"
//       options={{
//         minimap: { enabled: false },
//         fontSize: 14,
//         wordWrap: 'on',
//         autoIndent: 'full',
//         formatOnPaste: true,
//         formatOnType: true,
//       }}
//     />
//   );
// }

export default function CodeEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [code, setCode] = useState<string>('// Write your JavaScript code here\n\nfunction hello() {\n  console.log("Hello, world!");\n}\n\nhello();');
  const [language, setLanguage] = useState<string>('javascript');
  const [activeSnippet, setActiveSnippet] = useState<number | null>(null);
  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const consoleLogRef = useRef<string[]>([]);

  // Fetch user's code snippets
  const { data: snippets, isLoading: isSnippetsLoading } = useQuery({
    queryKey: ['/api/snippets/student', user?.id],
    enabled: !!user?.id,
  });

  // Form setup for saving code
  const form = useForm<InsertCodeSnippet>({
    resolver: zodResolver(insertCodeSnippetSchema),
    defaultValues: {
      studentId: user?.id || 0,
      title: '',
      code: code,
      language: language,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create code snippet mutation
  const createSnippetMutation = useMutation({
    mutationFn: async (data: InsertCodeSnippet) => {
      const res = await apiRequest('/api/snippets', 'POST', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/snippets/student', user?.id] });
      toast({
        title: 'Success',
        description: 'Code snippet saved successfully',
      });
      setSaveDialogOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save code snippet',
        variant: 'destructive',
      });
    },
  });

  // Update code snippet mutation
  const updateSnippetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCodeSnippet> }) => {
      const res = await apiRequest(`/api/snippets/${id}`, 'PUT', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/snippets/student', user?.id] });
      toast({
        title: 'Success',
        description: 'Code snippet updated successfully',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update code snippet',
        variant: 'destructive',
      });
    },
  });

  // Delete code snippet mutation
  const deleteSnippetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/snippets/${id}`, 'DELETE', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/snippets/student', user?.id] });
      toast({
        title: 'Success',
        description: 'Code snippet deleted successfully',
      });
      setActiveSnippet(null);
      setCode('// Write your JavaScript code here\n\nfunction hello() {\n  console.log("Hello, world!");\n}\n\nhello();');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete code snippet',
        variant: 'destructive',
      });
    },
  });

  function loadSnippet(id: number) {
    const snippet = snippets.find((s: any) => s.id === id);
    if (snippet) {
      setCode(snippet.code);
      setLanguage(snippet.language);
      setActiveSnippet(id);
    }
  }

  function createNewSnippet() {
    setActiveSnippet(null);
    setCode('// Write your JavaScript code here\n\nfunction hello() {\n  console.log("Hello, world!");\n}\n\nhello();');
    setLanguage('javascript');
  }

  function saveSnippet() {
    if (activeSnippet) {
      updateSnippetMutation.mutateAsync({
        id: activeSnippet,
        data: {
          code,
          language,
          updatedAt: new Date(),
        },
      });
    } else {
      setSaveDialogOpen(true);
      form.setValue('code', code);
      form.setValue('language', language);
    }
  }

  function deleteSnippet() {
    if (activeSnippet && window.confirm('Are you sure you want to delete this snippet?')) {
      deleteSnippetMutation.mutateAsync(activeSnippet);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(code).then(() => {
      toast({
        title: 'Copied!',
        description: 'Code copied to clipboard',
      });
    });
  }

  function downloadCode() {
    const element = document.createElement('a');
    const fileType = language === 'javascript' ? 'js' : language === 'html' ? 'html' : 'txt';
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `code-snippet.${fileType}`;
    document.body.appendChild(element);
    element.click();
  }

  // Execute JavaScript code (in a safe manner)
  function runCode() {
    if (language !== 'javascript') {
      toast({
        title: 'Error',
        description: `Running ${language} code is not supported in this demo`,
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setOutput('');
    consoleLogRef.current = [];

    try {
      // Capture console.log output
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        originalConsoleLog(...args);
        consoleLogRef.current.push(args.map(arg => String(arg)).join(' '));
        setOutput(consoleLogRef.current.join('\n'));
      };

      // Execute the code in a try-catch block
      const result = new Function(code)();
      
      // If there's a return value and no console.log was called
      if (result !== undefined && consoleLogRef.current.length === 0) {
        setOutput(String(result));
      } else if (consoleLogRef.current.length === 0) {
        setOutput('(Code executed without output)');
      }

      // Restore original console.log
      console.log = originalConsoleLog;
    } catch (error) {
      setOutput(`Error: ${(error as Error).message}`);
    } finally {
      setIsRunning(false);
    }
  }

  function onSubmit(data: InsertCodeSnippet) {
    setIsLoading(true);
    try {
      createSnippetMutation.mutateAsync({
        ...data,
        studentId: user?.id || 0,
        code,
        language,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle>
                  {activeSnippet 
                    ? snippets?.find((s: any) => s.id === activeSnippet)?.title || 'Code Editor' 
                    : 'Code Editor'}
                </CardTitle>
                <div className="flex gap-2">
                  <Select
                    value={language}
                    onValueChange={setLanguage}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="css">CSS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <MockMonacoEditor 
                value={code} 
                onChange={setCode} 
                language={language} 
              />
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)}>
                  <FolderOpen className="h-4 w-4 mr-1" />
                  {snippets && snippets.length > 0 ? 'Open' : 'My Snippets'}
                </Button>
                <Button 
                  variant={saveSuccess ? "outline" : "default"} 
                  size="sm" 
                  onClick={saveSnippet}
                  disabled={saveSuccess}
                >
                  {saveSuccess ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCode}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="destructive" size="sm" onClick={deleteSnippet} disabled={!activeSnippet}>
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="md:w-[350px]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Snippets</CardTitle>
            </CardHeader>
            <CardContent className="pb-0">
              {isSnippetsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !snippets || snippets.length === 0 ? (
                <div className="text-center p-4 text-neutral-500">
                  No saved snippets yet
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {snippets.map((snippet: any) => (
                    <button
                      key={snippet.id}
                      onClick={() => loadSnippet(snippet.id)}
                      className={`w-full text-left p-3 rounded-md hover:bg-neutral-100 transition-colors ${activeSnippet === snippet.id ? 'bg-primary-50 border border-primary-200' : 'bg-white border border-neutral-200'}`}
                    >
                      <div className="font-medium">{snippet.title}</div>
                      <div className="text-sm text-neutral-500 flex justify-between mt-1">
                        <span>{snippet.language}</span>
                        <span>{new Date(snippet.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-4">
              <Button variant="outline" className="w-full" onClick={createNewSnippet}>
                Create New Snippet
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2 flex-row justify-between items-center">
          <CardTitle>Console Output</CardTitle>
          <Button 
            onClick={runCode} 
            size="sm" 
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Code
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 font-mono p-4 rounded-md min-h-[150px] whitespace-pre-wrap">
            {output || '// Code output will appear here after execution'}
          </div>
        </CardContent>
      </Card>

      {/* Save Snippet Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Code Snippet</DialogTitle>
            <DialogDescription>
              Give your code snippet a name to save it for later use.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Snippet Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Array Sort Function" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSaveDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Snippet'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Open Snippet Dialog */}
      <Dialog open={snippets && snippets.length > 0 && isSaveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>My Code Snippets</DialogTitle>
            <DialogDescription>
              Open a previously saved code snippet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {snippets?.map((snippet: any) => (
              <button
                key={snippet.id}
                onClick={() => {
                  loadSnippet(snippet.id);
                  setSaveDialogOpen(false);
                }}
                className="w-full text-left p-3 rounded-md hover:bg-neutral-100 transition-colors bg-white border border-neutral-200"
              >
                <div className="font-medium">{snippet.title}</div>
                <div className="text-sm text-neutral-500 flex justify-between mt-1">
                  <span>{snippet.language}</span>
                  <span>{new Date(snippet.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                createNewSnippet();
                setSaveDialogOpen(false);
              }}
            >
              Create New
            </Button>
            <Button
              onClick={() => setSaveDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
