import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Bot, User, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  relatedReports?: number[];
}

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your AI assistant. I can help you with insights about your products, analyze your reports, compare different analyses, and answer questions about your business data. What would you like to know?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch reports for context
  const { data: reports = [] } = useQuery({
    queryKey: ["/api/reports"],
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        message,
        conversationHistory: messages.slice(-5), // Send last 5 messages for context
      });
      return response.json();
    },
    onSuccess: (response) => {
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: response.message,
        timestamp: new Date(),
        relatedReports: response.relatedReports || [],
      };
      setMessages(prev => [...prev, botMessage]);
    },
    onError: (error) => {
      toast({
        title: "Chat Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');

    chatMutation.mutate(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRelatedReportNames = (reportIds: number[]) => {
    return reports
      .filter(report => reportIds.includes(report.id))
      .map(report => report.productName);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-blue-600" />
          AI Assistant
        </h1>
        <p className="text-slate-600">
          Ask questions about your products, reports, and business insights. I have access to all your analysis data.
        </p>
      </div>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b border-slate-200 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5 text-blue-600" />
            Chat with AI Assistant
          </CardTitle>
          <div className="flex gap-2 text-sm text-slate-600">
            <Badge variant="outline">{reports.length} reports available</Badge>
            <Badge variant="outline">Real-time insights</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.relatedReports && message.relatedReports.length > 0 && (
                        <div className="flex gap-1">
                          {getRelatedReportNames(message.relatedReports).map((name, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {chatMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-slate-100 rounded-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-slate-600">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your products and reports..."
                disabled={chatMutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Questions */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Quick Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "What's my most successful product?",
            "Compare my products' pricing strategies",
            "What are common customer pain points?",
            "Which product has the best market positioning?",
            "Show me trends across my product analyses",
            "What marketing angles work best for my products?"
          ].map((question, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="text-left justify-start h-auto py-3 px-4 text-sm"
              onClick={() => setInputMessage(question)}
              disabled={chatMutation.isPending}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}