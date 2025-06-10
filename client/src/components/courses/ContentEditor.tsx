import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileVideo, FileType, FileText, Save, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface ContentEditorProps {
  initialContent: string;
  contentType: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  isNew: boolean;
  title: string;
}

export function ContentEditor({
  initialContent,
  contentType,
  onSave,
  onCancel,
  isNew,
  title
}: ContentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [type, setType] = useState(contentType);
  const [activeTab, setActiveTab] = useState('editor');

  const handleSaveContent = () => {
    onSave(content);
  };

  // HTML editor preview
  const renderHTMLPreview = () => {
    return (
      <div className="prose max-w-none p-4 border rounded-md bg-white min-h-[400px]" 
        dangerouslySetInnerHTML={{ __html: content }} />
    );
  };

  // Basic rich text editor
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // For PDF/Video content
  const handleMediaURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Media Type Selection */}
        <div className="mb-6">
          <Label>Content Type</Label>
          <RadioGroup 
            value={type} 
            onValueChange={setType} 
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rich_text" id="rich_text" />
              <Label htmlFor="rich_text" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Rich Text
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="video" id="video" />
              <Label htmlFor="video" className="flex items-center">
                <FileVideo className="h-4 w-4 mr-2" />
                Video
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center">
                <FileType className="h-4 w-4 mr-2" />
                PDF
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Content Editor */}
        {type === 'rich_text' ? (
          <div className="space-y-4">
            <Tabs defaultValue="editor" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="editor">
                <div className="border rounded-md p-4">
                  <Textarea
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Enter content here... (HTML is supported)"
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>HTML tags are supported for formatting. Examples:</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li><code>&lt;h1&gt;Heading&lt;/h1&gt;</code> - For large headings</li>
                    <li><code>&lt;p&gt;Paragraph&lt;/p&gt;</code> - For paragraphs</li>
                    <li><code>&lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt;</code> - For bullet lists</li>
                    <li><code>&lt;code&gt;Code&lt;/code&gt;</code> - For inline code</li>
                    <li><code>&lt;pre&gt;Code block&lt;/pre&gt;</code> - For code blocks</li>
                    <li><code>&lt;a href="url"&gt;Link&lt;/a&gt;</code> - For links</li>
                    <li><code>&lt;img src="url" alt="description"&gt;</code> - For images</li>
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="preview">
                {renderHTMLPreview()}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-4">
            <Label htmlFor="mediaUrl">
              {type === 'video' ? 'Video URL' : 'PDF URL'}
            </Label>
            <Input
              id="mediaUrl"
              value={content}
              onChange={handleMediaURLChange}
              placeholder={
                type === 'video'
                  ? 'Enter video URL (YouTube, Vimeo, or direct video link)'
                  : 'Enter PDF URL'
              }
            />
            <div className="p-4 border rounded-md bg-gray-50">
              <p className="text-sm text-muted-foreground">
                {type === 'video'
                  ? 'Enter the full URL to your video. For YouTube videos, use the standard YouTube URL or embed link.'
                  : 'Enter the full URL to your PDF file. The file should be hosted on a public server that allows embedding.'}
              </p>
            </div>

            {content && (
              <div className="mt-4 p-4 border rounded-md">
                <h4 className="text-sm font-medium mb-2">Preview:</h4>
                {type === 'video' ? (
                  content.includes('youtube.com') || content.includes('youtu.be') ? (
                    <div className="relative aspect-video">
                      <iframe
                        src={content.replace('watch?v=', 'embed/')}
                        className="absolute inset-0 w-full h-full"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="relative aspect-video">
                      <video src={content} controls className="w-full h-full"></video>
                    </div>
                  )
                ) : (
                  <div className="relative aspect-[8.5/11] h-[400px]">
                    <iframe src={content} className="absolute inset-0 w-full h-full"></iframe>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSaveContent}>
          <Save className="h-4 w-4 mr-2" />
          {isNew ? 'Create' : 'Update'} Content
        </Button>
      </CardFooter>
    </Card>
  );
}