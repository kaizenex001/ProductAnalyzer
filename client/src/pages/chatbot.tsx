import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Bot, User, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface Report {
  id: number;
  productName: string;
  [key: string]: any;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch reports for context
  const { data: reports = [] } = useQuery<Report[]>({
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
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRelatedReportNames = (reportIds: number[]): string[] => {
    return reports
      .filter((report: Report) => reportIds.includes(report.id))
      .map((report: Report) => report.productName);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-3 flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-blue-600" />
          AI Assistant
        </h1>
        <p className="text-slate-600 text-lg">
          Ask questions about your products, reports, and business insights. I have access to all your analysis data.
        </p>
      </div>

      {/* Chat Interface */}
      <Card className="h-[calc(100vh-200px)] flex flex-col shadow-lg">
        <CardHeader className="border-b border-slate-200 pb-4 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5 text-blue-600" />
            Chat with AI Assistant
          </CardTitle>
          <div className="flex gap-2 text-sm text-slate-600">
            <Badge variant="outline">{Array.isArray(reports) ? reports.length : 0} reports available</Badge>
            <Badge variant="outline">Real-time insights</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-lg px-4 py-3 shadow-sm ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900 border border-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.relatedReports && message.relatedReports.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {getRelatedReportNames(message.relatedReports).map((name: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {chatMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-slate-100 rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm border border-slate-200">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-slate-600">Thinking...</span>
                  </div>
                </div>
              )}
              
              {/* Invisible div to scroll to */}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 p-4 bg-slate-50/50 flex-shrink-0">
            <div className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your products and reports..."
                disabled={chatMutation.isPending}
                className="flex-1 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Questions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          Quick Questions
        </h3>
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
              className="text-left justify-start h-auto py-4 px-4 text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors border-slate-200"
              onClick={() => setInputMessage(question)}
              disabled={chatMutation.isPending}
            >
              <span className="text-slate-700">{question}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}