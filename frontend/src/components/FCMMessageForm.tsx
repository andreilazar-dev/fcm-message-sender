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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, X, Info, Send, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TargetType = "token" | "topic";

interface FCMMessage {
  token?: string;
  topic?: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
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
      channel_id?: string;
      ticker?: string;
      notification_count?: number;
      imageUrl?: string;
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
        subtitle?: string;
        "interruption-level"?: "active" | "passive" | "time-sensitive";
      };
    };
    fcm_options?: {
      image?: string;
    };
  };
  webpush?: {
    headers?: {
      image?: string;
    };
    notification?: {
      requireInteraction?: boolean;
      vibrate?: number[];
    };
  };
}

interface FCMMessageFormProps {
  selectedProject: string | null;
  onSendMessage: (message: FCMMessage) => Promise<any>;
}

export const FCMMessageForm = ({ selectedProject, onSendMessage }: FCMMessageFormProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [targetType, setTargetType] = useState<TargetType>("token");
  const [formData, setFormData] = useState({
    target: "",
    notification: {
      title: "",
      body: "",
      icon: "",
      // image: "", // Removed
      click_action: "",
      badge: ""
    },
    customData: [] as { key: string; value: string }[],
    android: {
      sound: "",
      color: "",
      tag: "",
      priority: "",
      channelId: "",
      ticker: "",
      notificationCount: "",
      imageUrl: "" // Added
    },
    apns: {
      sound: "",
      badge: "",
      category: "",
      threadId: "",
      contentAvailable: false,
      mutableContent: false,
      subtitle: "",
      interruptionLevel: "",
      fcmOptionsImage: "" // Added for apns.fcm_options.image
    },
    webpush: {
      requireInteraction: false,
      vibrate: "",
      headersImage: "" // Added for webpush.headers.image
    }
  });

  const [customDataKey, setCustomDataKey] = useState("");
  const [customDataValue, setCustomDataValue] = useState("");
  const [receivedJson, setReceivedJson] = useState<Record<string, unknown> | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Build final message with only non-empty fields
  const finalMessage = useMemo((): FCMMessage => {
    const message: FCMMessage = {
      notification: {
        title: formData.notification.title,
        body: formData.notification.body
      }
    };

    if (targetType === 'token') {
      message.token = formData.target;
    } else {
      message.topic = formData.target;
    }

    // Add optional notification fields only if not empty
    if (formData.notification.icon?.trim()) {
      message.notification.icon = formData.notification.icon;
    }
    // Add optional notification fields only if not empty
    if (formData.notification.icon?.trim()) {
      message.notification.icon = formData.notification.icon;
    }
    if (formData.notification.click_action?.trim()) {
      message.notification.click_action = formData.notification.click_action;
    }
    if (formData.notification.badge?.trim()) {
      message.notification.badge = formData.notification.badge;
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
    const androidConfig: Partial<FCMMessage['android']['notification']> = {};
    if (formData.android.sound?.trim()) androidConfig.sound = formData.android.sound;
    if (formData.android.color?.trim()) androidConfig.color = formData.android.color;
    if (formData.android.tag?.trim()) androidConfig.tag = formData.android.tag;
    if (formData.android.priority?.trim()) androidConfig.priority = formData.android.priority;
    if (formData.android.channelId?.trim()) androidConfig.channel_id = formData.android.channelId;
    if (formData.android.ticker?.trim()) androidConfig.ticker = formData.android.ticker;
    if (formData.android.notificationCount?.trim()) androidConfig.notification_count = parseInt(formData.android.notificationCount);
    if (formData.android.imageUrl?.trim()) androidConfig.imageUrl = formData.android.imageUrl;
    
    if (Object.keys(androidConfig).length > 0) {
      message.android = { notification: androidConfig as FCMMessage['android']['notification'] };
    }

    // Add APNS config only if has values
    const apnsConfig: Partial<FCMMessage['apns']['payload']['aps']> = {};
    if (formData.apns.sound?.trim()) apnsConfig.sound = formData.apns.sound;
    if (formData.apns.badge?.trim()) apnsConfig.badge = parseInt(formData.apns.badge);
    if (formData.apns.category?.trim()) apnsConfig.category = formData.apns.category;
    if (formData.apns.threadId?.trim()) apnsConfig["thread-id"] = formData.apns.threadId;
    if (formData.apns.contentAvailable) apnsConfig["content-available"] = 1;
    if (formData.apns.mutableContent) apnsConfig["mutable-content"] = 1;
    if (formData.apns.subtitle?.trim()) apnsConfig.subtitle = formData.apns.subtitle;
    if (formData.apns.interruptionLevel?.trim()) apnsConfig["interruption-level"] = formData.apns.interruptionLevel as "active" | "passive" | "time-sensitive";

    const apnsFCMOptions: Partial<FCMMessage['apns']['fcm_options']> = {};
    if (formData.apns.fcmOptionsImage?.trim()) apnsFCMOptions.image = formData.apns.fcmOptionsImage;

    if (Object.keys(apnsConfig).length > 0 || Object.keys(apnsFCMOptions).length > 0) {
      message.apns = { payload: { aps: apnsConfig as FCMMessage['apns']['payload']['aps'] } };
      if (Object.keys(apnsFCMOptions).length > 0) {
        message.apns.fcm_options = apnsFCMOptions as FCMMessage['apns']['fcm_options'];
      }
    }

    // Add WebPush config only if has values
    const webpushNotificationConfig: Partial<FCMMessage['webpush']['notification']> = {};
    if (formData.webpush.requireInteraction) webpushNotificationConfig.requireInteraction = true;
    if (formData.webpush.vibrate?.trim()) {
      const vibrate = formData.webpush.vibrate.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      if (vibrate.length > 0) webpushNotificationConfig.vibrate = vibrate;
    }

    const webpushHeadersConfig: Partial<FCMMessage['webpush']['headers']> = {};
    if (formData.webpush.headersImage?.trim()) webpushHeadersConfig.image = formData.webpush.headersImage;

    if (Object.keys(webpushNotificationConfig).length > 0 || Object.keys(webpushHeadersConfig).length > 0) {
      if (Object.keys(webpushNotificationConfig).length > 0) {
        message.webpush = { notification: webpushNotificationConfig as FCMMessage['webpush']['notification'] };
      }
      if (Object.keys(webpushHeadersConfig).length > 0) {
        if (!message.webpush) message.webpush = {};
        message.webpush.headers = webpushHeadersConfig as FCMMessage['webpush']['headers'];
      }
    }

    return message;
  }, [formData, targetType]);

  const handleSendMessage = async () => {
    // Validations
    if (!selectedProject) {
      toast({ title: t('message.errors.noProject'), variant: "destructive" });
      return;
    }
    if (!formData.target.trim()) {
      toast({ title: t(targetType === 'token' ? 'message.errors.noToken' : 'message.errors.noTopic'), variant: "destructive" });
      return;
    }
    if (!formData.notification.title.trim() || !formData.notification.body.trim()) {
      toast({ title: t('message.errors.noTitle'), description: t('message.errors.noBody'), variant: "destructive" });
      return;
    }

    setIsSending(true);
    setReceivedJson(null);

    try {
      const response = await onSendMessage(finalMessage);
      setReceivedJson(response);
      toast({
        title: t('message.success.sent'),
        description: t('message.success.sentDescription', { project: selectedProject }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setReceivedJson({ error: errorMessage });
      toast({
        title: t('message.errors.sendError'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
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
            {/* Target */}
            <div className="space-y-3">
              <Label>{t('message.target.title')} *</Label>
              <RadioGroup
                defaultValue="token"
                value={targetType}
                onValueChange={(value: TargetType) => setTargetType(value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="token" id="token" />
                  <Label htmlFor="token">{t('message.target.token')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="topic" id="topic" />
                  <Label htmlFor="topic">{t('message.target.topic')}</Label>
                </div>
              </RadioGroup>
              
              {targetType === 'token' ? (
                <div className="space-y-2">
                  <InfoTooltip content={t('message.tooltips.deviceToken')}>
                    <Label htmlFor="deviceToken">{t('message.deviceToken')} *</Label>
                  </InfoTooltip>
                  <Input
                    id="deviceToken"
                    placeholder={t('message.deviceTokenPlaceholder')}
                    value={formData.target}
                    onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                    className="font-mono text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <InfoTooltip content={t('message.tooltips.topic')}>
                    <Label htmlFor="topicName">{t('message.topicName')} *</Label>
                  </InfoTooltip>
                  <Input
                    id="topicName"
                    placeholder={t('message.topicNamePlaceholder')}
                    value={formData.target}
                    onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                    className="font-mono text-sm"
                  />
                </div>
              )}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.androidChannelId')}>
                      <Label>{t('message.android.channelId')}</Label>
                    </InfoTooltip>
                    <Input
                      placeholder="channel_id"
                      value={formData.android.channelId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        android: { ...prev.android, channelId: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.androidTicker')}>
                      <Label>{t('message.android.ticker')}</Label>
                    </InfoTooltip>
                    <Input
                      placeholder="New message ticker"
                      value={formData.android.ticker}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        android: { ...prev.android, ticker: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <InfoTooltip content={t('message.tooltips.androidNotificationCount')}>
                      <Label>{t('message.android.notificationCount')}</Label>
                    </InfoTooltip>
                    <Input
                      type="number"
                      placeholder="10"
                      value={formData.android.notificationCount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        android: { ...prev.android, notificationCount: e.target.value }
                      }))}
                    />
                  </div>

                <div className="space-y-2">
                  <InfoTooltip content={t('message.tooltips.androidImageUrl')}>
                    <Label htmlFor="androidImageUrl">{t('message.android.imageUrl')}</Label>
                  </InfoTooltip>
                  <Input
                    id="androidImageUrl"
                    placeholder="https://foo.bar.pizza-monster.png"
                    value={formData.android.imageUrl}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      android: { ...prev.android, imageUrl: e.target.value }
                    }))}
                  />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <InfoTooltip content={t('message.tooltips.apnsSubtitle')}>
                        <Label>{t('message.apns.subtitle')}</Label>
                        </InfoTooltip>
                        <Input
                        placeholder="Notification subtitle"
                        value={formData.apns.subtitle}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            apns: { ...prev.apns, subtitle: e.target.value }
                        }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <InfoTooltip content={t('message.tooltips.apnsInterruptionLevel')}>
                        <Label>{t('message.apns.interruptionLevel')}</Label>
                        </InfoTooltip>
                        <Select
                        value={formData.apns.interruptionLevel}
                        onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            apns: { ...prev.apns, interruptionLevel: value }
                        }))}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Select interruption level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="passive">{t('message.apns.interruptionLevels.passive')}</SelectItem>
                            <SelectItem value="active">{t('message.apns.interruptionLevels.active')}</SelectItem>
                            <SelectItem value="time-sensitive">{t('message.apns.interruptionLevels.time-sensitive')}</SelectItem>
                        </SelectContent>
                        </Select>
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

                <div className="space-y-2">
                  <InfoTooltip content={t('message.tooltips.apnsFCMOptionsImage')}>
                    <Label htmlFor="apnsFCMOptionsImage">{t('message.apns.fcmOptionsImage')}</Label>
                  </InfoTooltip>
                  <Input
                    id="apnsFCMOptionsImage"
                    placeholder="https://foo.bar.pizza-monster.png"
                    value={formData.apns.fcmOptionsImage}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      apns: { ...prev.apns, fcmOptionsImage: e.target.value }
                    }))}
                  />
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

                <div className="space-y-2">
                  <InfoTooltip content={t('message.tooltips.webpushHeadersImage')}>
                    <Label htmlFor="webpushHeadersImage">{t('message.webpush.headersImage')}</Label>
                  </InfoTooltip>
                  <Input
                    id="webpushHeadersImage"
                    placeholder="https://foo.bar.pizza-monster.png"
                    value={formData.webpush.headersImage}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      webpush: { ...prev.webpush, headersImage: e.target.value }
                    }))}
                  />
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
              disabled={!selectedProject || !formData.target.trim() || isSending}
              className="w-full"
              size="lg"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  {t('message.sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('message.send')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};