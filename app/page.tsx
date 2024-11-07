"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Phone,
  Video,
  Mic,
  FileIcon,
  Smile,
  Send,
  MoreVertical,
  Image as ImageIcon,
  Edit2,
  Check,
  ThumbsUp,
  X,
  Search,
} from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"; // ShadCN Card components import

interface Message {
  id: string;
  text?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: Date;
  sender: string;
  senderName: string;
  type: "text" | "audio" | "image" | "file";
  isEdited?: boolean;
  isRead?: boolean;
}

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const maxCharacters = 5000;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (newMessage.trim() || audioURL || previewFile) {
      const newMsg: Message = {
        id: Date.now().toString(),
        text: newMessage,
        audioUrl: audioURL,
        timestamp: new Date(),
        sender: "currentUser",
        senderName: "Dr. Ahmed Hassan",
        type: audioURL
          ? "audio"
          : previewFile
          ? previewFile.type.startsWith("image/") 
            ? "image" 
            : "file"
          : "text",
        isRead: false,
      };

      if (previewFile) {
        newMsg.fileUrl = URL.createObjectURL(previewFile);
        newMsg.fileName = previewFile.name;
      }

      setMessages((prevMessages) => [...prevMessages, newMsg]);
      setNewMessage("");
      setAudioURL("");
      setPreviewFile(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreviewFile(file);
    }
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    if (newMessage.length + emoji.native.length <= maxCharacters) {
      setNewMessage((prevMessage) => prevMessage + emoji.native);
    }
    setShowEmojiPicker(false);
  };

  const startEditing = (messageId: string) => {
    setEditingMessageId(messageId);
    const messageToEdit = messages.find((msg) => msg.id === messageId);
    if (messageToEdit) {
      setNewMessage(messageToEdit.text || "");
    }
  };

  const saveEdit = () => {
    if (editingMessageId) {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === editingMessageId
            ? { ...msg, text: newMessage, type: "text", isEdited: true }
            : msg
        )
      );
      setEditingMessageId(null);
      setNewMessage("");
    }
  };

  const cancelPreview = () => {
    setPreviewFile(null);
    setAudioURL("");
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setSearchQuery("");
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-200">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const filteredMessages = searchQuery
    ? messages.filter(
        (msg) =>
          msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 ">
            <AvatarImage src="/placeholder.svg" alt="Room" />
            <AvatarFallback className="rounded-full bg-gradient-to-r from-red-600 to-blue-600 hover:opacity-90">RM</AvatarFallback>
          </Avatar>
          <span className="font-semibold">Room Name</span>
        </div>
        <div className="flex items-center gap-2">
          {isSearching ? (
            <div className="flex items-center">
              <Input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mr-2"
              />
              <Button variant="ghost" size="icon" onClick={toggleSearch}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={toggleSearch}>
                <Search className="w-5 h-5" />
              </Button>
              <Button className=" rounded-full text-white bg-gradient-to-l from-red-600 to-blue-600 hover:opacity-90" variant="ghost" >
                <Phone className="w-5 h-5" />
                <p>Call</p>
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="w-5 h-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Mute notifications</DropdownMenuItem>
                  <DropdownMenuItem>Search</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "currentUser" ? "justify-end" : "justify-start"
            }`}
          >
            <div className="flex gap-3 max-w-[80%]">
              {message.sender !== "currentUser" && (
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src="/placeholder.svg"
                    alt={message.senderName}
                  />
                  <AvatarFallback>
                    {message.senderName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* ShadCN Card */}
              <Card className="w-screen">
                <CardHeader className="p-1 px-3 border-b-[1px]">
                  <CardTitle className="text-lg">{message.senderName}</CardTitle>
                </CardHeader>
                <CardContent className="mt-2 px-2 py-1 ">
                  {message.type === "text" && (
                    <p>{highlightText(message.text || "", searchQuery)}</p>
                  )}
                  {message.type === "audio" && (
                    <audio controls src={message.audioUrl} className="max-w-full" />
                  )}
                  {message.type === "image" && (
                    <Image
                      src={message.fileUrl || ""}
                      alt={message.fileName || "Uploaded image"}
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  )}
                  {message.type === "file" && (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:underline"
                    >
                      <FileIcon className="w-4 h-4" />
                      {highlightText(message.fileName || "", searchQuery)}
                    </a>
                  )}
                </CardContent>
                <CardFooter className="relative">
                  {message.isEdited && <span className="text-sm text-gray-500">Edited</span>}


                  {/* Timestamp at bottom-right */}
                  <div className="absolute bottom-1 right-2 text-sm text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input Field */}
      <div className="flex items-center p-4 border-t">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onFocus={() => setShowEmojiPicker(false)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="absolute right-0 top-1/2 transform -translate-y-1/2"
          >
            <Smile className="w-5 h-5" />
          </Button>
        </div>

        {/* Voice Recording Button with Styles for Recording */}
        <Button
          variant="ghost"
          size="icon"
          onClick={isRecording ? stopRecording : startRecording}
          className={`ml-2 ${isRecording ? 'bg-red-600 text-white' : ''} p-2 rounded-full`}
        >
          <Mic className="w-5 h-5" />
        </Button>

        {/* File Input */}
        <input
          type="file"
          accept="image/*,audio/*,video/*,application/*"
          className="hidden"
          id="fileInput"
          onChange={handleFileUpload}
        />
        <Button
          variant="ghost"
          size="icon"
          className="ml-2"
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <FileIcon className="w-5 h-5" />
        </Button>

        <Button
          className="ml-2 rounded-full bg-gradient-to-r from-red-600 to-blue-600 hover:opacity-90 "
          onClick={sendMessage}
        >
          <p>Send</p>
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <Picker data={data} onEmojiSelect={handleEmojiSelect} />
        </div>
      )}
    </div>
  );
}
