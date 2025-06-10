import CodeEditor from '@/components/code-editor/CodeEditor';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Github } from 'lucide-react';

export default function CodeEditorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">JavaScript Code Editor</h1>
        <p className="text-neutral-500">Write, test, and save your JavaScript code</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Editor Features</AlertTitle>
        <AlertDescription className="mt-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Write and run JavaScript code directly in your browser</li>
            <li>Save snippets for future reference</li>
            <li>Share code with your trainer for feedback</li>
            <li>Submit code as part of your assignments</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>GitHub Integration</CardTitle>
            <CardDescription>
              Connect your GitHub account to submit assignments through pull requests.
            </CardDescription>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                <Github className="mr-2 h-4 w-4" />
                Connect GitHub
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
            <CardDescription>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Run Code</span>
                  <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded">Ctrl + Enter</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Save Snippet</span>
                  <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded">Ctrl + S</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Format Code</span>
                  <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded">Shift + Alt + F</span>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <CodeEditor />
    </div>
  );
}
