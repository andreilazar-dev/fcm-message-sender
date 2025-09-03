import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Info, Send, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FCMMessage {
  to: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    click_action?: string;
    badge?: string;
  };
  data?: Record<string, string>;
  android?: {
    notification: {
      sound?: string;
      color?: string;
      tag?: string;
      priority?: string;
    };
  };
  apns?: {
    payload: {
      aps: {
        sound?: string;
        badge?: number;
        category?: string;
        "thread-id"?: string;
        "content-available"?: number;
        "mutable-content"?: number;
      };
    };
  };
  webpush?: {
    notification: {
      requireInteraction?: boolean;
      vibrate?: number[];
    };
  };
}

interface FCMMessageFormProps {
  selectedProject: string | null;
  onSendMessage: (message: FCMMessage) => void;
}

export const FCMMessageForm = ({ selectedProject, onSendMessage }: FCMMessageFormProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    to: "",
    notification: {
      title: "",
      body: "",
      icon: "",
      image: "",
      click_action: "",
      badge: ""
    },
    customData: [] as { key: string; value: string }[],
    android: {
      sound: "",
      color: "",
      tag: "",
      priority: ""
    },
    apns: {
      sound: "",
      badge: "",
      category: "",
      threadId: "",
      contentAvailable: false,
      mutableContent: false
    },
    webpush: {
      requireInteraction: false,
      vibrate: ""
    }
  });

  const [customDataKey, setCustomDataKey] = useState("");
  const [customDataValue, setCustomDataValue] = useState("");
  const [receivedJson, setReceivedJson] = useState<any>(null);

  // Build final message with only non-empty fields
  const finalMessage = useMemo((): FCMMessage => {
    const message: FCMMessage = {
      to: formData.to,
      notification: {
        title: formData.notification.title,
        body: formData.notification.body
      }
    };

    // Add optional notification fields only if not empty
    if (formData.notification.icon?.trim()) {
      message.notification.icon = formData.notification.icon;
    }
    if (formData.notification.image?.trim()) {
      message.notification.image = formData.notification.image;
    }
    if (formData.notification.click_action?.trim()) {
      message.notification.click_action = formData.notification.click_action;
    }
    if (formData.notification.badge?.trim()) {
      message.notification.badge = formData.notification.badge;
    }

    // Add custom data only if exists
    if (formData.customData.length > 0) {
      message.data = Object.fromEntries(formData.customData.map(item => [item.key, item.value]));
    }

    // Add Android config only if has values
    const androidConfig: any = {};
    if (formData.android.sound?.trim()) androidConfig.sound = formData.android.sound;
    if (formData.android.color?.trim()) androidConfig.color = formData.android.color;
    if (formData.android.tag?.trim()) androidConfig.tag = formData.android.tag;
    if (formData.android.priority?.trim()) androidConfig.priority = formData.android.priority;
    
    if (Object.keys(androidConfig).length > 0) {
      message.android = { notification: androidConfig };
    }

    // Add APNS config only if has values
    const apnsConfig: any = {};
    if (formData.apns.sound?.trim()) apnsConfig.sound = formData.apns.sound;
    if (formData.apns.badge?.trim()) apnsConfig.badge = parseInt(formData.apns.badge);
    if (formData.apns.category?.trim()) apnsConfig.category = formData.apns.category;
    if (formData.apns.threadId?.trim()) apnsConfig["thread-id"] = formData.apns.threadId;
    if (formData.apns.contentAvailable) apnsConfig["content-available"] = 1;
    if (formData.apns.mutableContent) apnsConfig["mutable-content"] = 1;

    if (Object.keys(apnsConfig).length > 0) {
      message.apns = { payload: { aps: apnsConfig } };
    }

    // Add WebPush config only if has values
    const webpushConfig: any = {};
    if (formData.webpush.requireInteraction) webpushConfig.requireInteraction = true;
    if (formData.webpush.vibrate?.trim()) {
      const vibrate = formData.webpush.vibrate.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      if (vibrate.length > 0) webpushConfig.vibrate = vibrate;
    }

    if (Object.keys(webpushConfig).length > 0) {
      message.webpush = { notification: webpushConfig };
    }

    return message;
  }, [formData]);

  const handleSendMessage = async () => {
    if (!selectedProject) {
      toast({
        title: t('message.errors.noProject'),
        variant: "destructive"
      });
      return;
    }

    if (!formData.to.trim()) {
      toast({
        title: t('message.errors.noToken'),
        variant: "destructive"
      });
      return;
    }

    if (!formData.notification.title.trim() || !formData.notification.body.trim()) {
      toast({
        title: t('message.errors.noTitle'),
        description: t('message.errors.noBody'),
        variant: "destructive"
      });
      return;
    }

    // Simulate received response
    setReceivedJson({
      success: true,
      message_id: `fcm_${Date.now()}`,
      multicast_id: Math.floor(Math.random() * 1000000000000000),
      success_count: 1,
      failure_count: 0,
      canonical_ids: 0,
      results: [
        {
          message_id: `0:${Date.now()}%${Math.random().toString(36).substr(2, 9)}`
        }
      ]
    });

    onSendMessage(finalMessage);
  };

  const addCustomData = () => {
    if (customDataKey.trim() && customDataValue.trim()) {
      setFormData(prev => ({
        ...prev,
        customData: [...prev.customData, { key: customDataKey, value: customDataValue }]
      }));
      setCustomDataKey("");
      setCustomDataValue("");
    }
  };

  const removeCustomData = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customData: prev.customData.filter((_, i) => i !== index)
    }));
  };

  const InfoTooltip = ({ children, content }: { children: React.ReactNode, content: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1">
          {children}
          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            {t('message.title')}
            {selectedProject && (
              <Badge variant="secondary" className="ml-auto">
                {selectedProject}
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('message.description')}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Device Token */}
            <div className="space-y-2">
              <InfoTooltip content={t('message.tooltips.deviceToken')}>
                <Label htmlFor="deviceToken">{t('message.deviceToken')} *</Label>
              </InfoTooltip>
              <Input
                id="deviceToken"
                placeholder={t('message.deviceTokenPlaceholder')}
                value={formData.to}
                onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>

            <Tabs defaultValue="notification" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="notification">{t('message.tabs.notification')}</TabsTrigger>
                <TabsTrigger value="data">{t('message.tabs.customData')}</TabsTrigger>
                <TabsTrigger value="android">{t('message.tabs.android')}</TabsTrigger>
                <TabsTrigger value="apns">{t('message.tabs.apns')}</TabsTrigger>
                <TabsTrigger value="webpush">{t('message.tabs.webpush')}</TabsTrigger>
              </TabsList>

              {/* Notification Tab */}
              <TabsContent value="notification" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.title')}>
                      <Label htmlFor="title">{t('message.notification.title')} *</Label>
                    </InfoTooltip>
                    <Input
                      id="title"
                      placeholder="Push notification title"
                      value={formData.notification.title}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notification: { ...prev.notification, title: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.icon')}>
                      <Label htmlFor="icon">{t('message.notification.icon')}</Label>
                    </InfoTooltip>
                    <Input
                      id="icon"
                      placeholder="https://example.com/icon.png"
                      value={formData.notification.icon}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notification: { ...prev.notification, icon: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <InfoTooltip content={t('message.tooltips.body')}>
                    <Label htmlFor="body">{t('message.notification.body')} *</Label>
                  </InfoTooltip>
                  <Textarea
                    id="body"
                    placeholder="Your custom push message here"
                    value={formData.notification.body}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notification: { ...prev.notification, body: e.target.value }
                    }))}
                    className="min-h-20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.image')}>
                      <Label htmlFor="image">{t('message.notification.image')}</Label>
                    </InfoTooltip>
                    <Input
                      id="image"
                      placeholder="https://example.com/image.jpg"
                      value={formData.notification.image}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notification: { ...prev.notification, image: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.clickAction')}>
                      <Label htmlFor="clickAction">{t('message.notification.clickAction')}</Label>
                    </InfoTooltip>
                    <Input
                      id="clickAction"
                      placeholder="https://example.com or FLUTTER_NOTIFICATION_CLICK"
                      value={formData.notification.click_action}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notification: { ...prev.notification, click_action: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <InfoTooltip content={t('message.tooltips.badge')}>
                    <Label htmlFor="badge">{t('message.notification.badge')}</Label>
                  </InfoTooltip>
                  <Input
                    id="badge"
                    placeholder="https://example.com/badge.png"
                    value={formData.notification.badge}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notification: { ...prev.notification, badge: e.target.value }
                    }))}
                  />
                </div>
              </TabsContent>

              {/* Custom Data Tab */}
              <TabsContent value="data" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={t('message.customData.key')}
                      value={customDataKey}
                      onChange={(e) => setCustomDataKey(e.target.value)}
                    />
                    <Input
                      placeholder={t('message.customData.value')}
                      value={customDataValue}
                      onChange={(e) => setCustomDataValue(e.target.value)}
                    />
                  </div>
                  <Button onClick={addCustomData} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('message.customData.add')}
                  </Button>
                  
                  <div className="space-y-2">
                    <Label>Current Custom Data:</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.customData.map((item, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeCustomData(index)}
                        >
                          {item.key}: {item.value} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Android Specific Tab */}
              <TabsContent value="android" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.androidSound')}>
                      <Label>{t('message.android.sound')}</Label>
                    </InfoTooltip>
                    <Input
                      placeholder="default"
                      value={formData.android.sound}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        android: { ...prev.android, sound: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.androidColor')}>
                      <Label>{t('message.android.color')}</Label>
                    </InfoTooltip>
                    <Input
                      placeholder="#3B82F6"
                      value={formData.android.color}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        android: { ...prev.android, color: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.androidTag')}>
                      <Label>{t('message.android.tag')}</Label>
                    </InfoTooltip>
                    <Input
                      placeholder="notification_tag"
                      value={formData.android.tag}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        android: { ...prev.android, tag: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.androidPriority')}>
                      <Label>{t('message.android.priority')}</Label>
                    </InfoTooltip>
                    <Select
                      value={formData.android.priority}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        android: { ...prev.android, priority: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="min">{t('message.android.priorities.min')}</SelectItem>
                        <SelectItem value="low">{t('message.android.priorities.low')}</SelectItem>
                        <SelectItem value="default">{t('message.android.priorities.default')}</SelectItem>
                        <SelectItem value="high">{t('message.android.priorities.high')}</SelectItem>
                        <SelectItem value="max">{t('message.android.priorities.max')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* APNS Tab */}
              <TabsContent value="apns" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.apnsSound')}>
                      <Label>{t('message.apns.sound')}</Label>
                    </InfoTooltip>
                    <Input
                      placeholder="default"
                      value={formData.apns.sound}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        apns: { ...prev.apns, sound: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.apnsBadge')}>
                      <Label>{t('message.apns.badge')}</Label>
                    </InfoTooltip>
                    <Input
                      type="number"
                      placeholder="1"
                      value={formData.apns.badge}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        apns: { ...prev.apns, badge: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.apnsCategory')}>
                      <Label>{t('message.apns.category')}</Label>
                    </InfoTooltip>
                    <Input
                      placeholder="MESSAGE_CATEGORY"
                      value={formData.apns.category}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        apns: { ...prev.apns, category: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.apnsThreadId')}>
                      <Label>{t('message.apns.threadId')}</Label>
                    </InfoTooltip>
                    <Input
                      placeholder="thread-1"
                      value={formData.apns.threadId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        apns: { ...prev.apns, threadId: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="contentAvailable"
                      checked={formData.apns.contentAvailable}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        apns: { ...prev.apns, contentAvailable: checked }
                      }))}
                    />
                    <InfoTooltip content={t('message.tooltips.apnsContentAvailable')}>
                      <Label htmlFor="contentAvailable">{t('message.apns.contentAvailable')}</Label>
                    </InfoTooltip>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mutableContent"
                      checked={formData.apns.mutableContent}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        apns: { ...prev.apns, mutableContent: checked }
                      }))}
                    />
                    <InfoTooltip content={t('message.tooltips.apnsMutableContent')}>
                      <Label htmlFor="mutableContent">{t('message.apns.mutableContent')}</Label>
                    </InfoTooltip>
                  </div>
                </div>
              </TabsContent>

              {/* Web Push Tab */}
              <TabsContent value="webpush" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireInteraction"
                      checked={formData.webpush.requireInteraction}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        webpush: { ...prev.webpush, requireInteraction: checked }
                      }))}
                    />
                    <InfoTooltip content={t('message.tooltips.webpushRequireInteraction')}>
                      <Label htmlFor="requireInteraction">{t('message.webpush.requireInteraction')}</Label>
                    </InfoTooltip>
                  </div>
                  
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.webpushVibrate')}>
                      <Label>{t('message.webpush.vibrate')}</Label>
                    </InfoTooltip>
                    <Input
                      placeholder="200,100,200"
                      value={formData.webpush.vibrate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        webpush: { ...prev.webpush, vibrate: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* JSON Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('message.jsonPreview.sent')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                    {JSON.stringify(finalMessage, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('message.jsonPreview.received')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                    {receivedJson ? JSON.stringify(receivedJson, null, 2) : "No response yet..."}
                  </pre>
                </CardContent>
              </Card>
            </div>

            <Button 
              onClick={handleSendMessage}
              disabled={!selectedProject || !formData.to.trim()}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              {t('message.send')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};