import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Info, Send, Smartphone, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { produce } from "immer";

// #region Interfaces
interface FcmMessageV1 { message: Message; }
interface Message {
    token?: string;
    topic?: string;
    condition?: string;
    data?: Record<string, string>;
    notification?: Notification;
    fcm_options?: { analytics_label?: string; };
    android?: AndroidConfig;
    apns?: ApnsConfig;
    webpush?: WebpushConfig;
}
interface Notification { title?: string; body?: string; }
interface AndroidConfig {
    ttl?: string;
    priority?: 'NORMAL' | 'HIGH';
    collapse_key?: string;
    restricted_package_name?: string;
    data?: Record<string, string>;
    notification?: AndroidNotification;
    fcm_options?: { analytics_label?: string; };
}
interface AndroidNotification {
    title?: string;
    body?: string;
    icon?: string;
    color?: string;
    sound?: string;
    tag?: string;
    click_action?: string;
    body_loc_key?: string;
    body_loc_args?: string[];
    title_loc_key?: string;
    title_loc_args?: string[];
    channel_id?: string;
    ticker?: string;
    sticky?: boolean;
    event_time?: string;
    local_only?: boolean;
    default_sound?: boolean;
    default_vibrate_timings?: boolean;
    default_light_settings?: boolean;
    vibrate_timings?: string[];
    visibility?: 'VISIBILITY_UNSPECIFIED' | 'PRIVATE' | 'PUBLIC' | 'SECRET';
    notification_priority?: 'PRIORITY_UNSPECIFIED' | 'PRIORITY_MIN' | 'PRIORITY_LOW' | 'PRIORITY_DEFAULT' | 'PRIORITY_HIGH' | 'PRIORITY_MAX';
    importance?: 'IMPORTANCE_UNSPECIFIED' | 'IMPORTANCE_LOW' | 'IMPORTANCE_DEFAULT' | 'IMPORTANCE_HIGH' | 'IMPORTANCE_MIN';
    light_settings?: { color: { red: number; green: number; blue: number; alpha: number; }; light_on_duration?: string; light_off_duration?: string; };
    image?: string;
}
interface ApnsConfig {
    headers?: Record<string, string>;
    payload?: { aps: Aps; [key: string]: any; };
    fcm_options?: { analytics_label?: string; image?: string; };
}
interface Aps {
    alert?: { title?: string; body?: string; };
    badge?: number;
    sound?: string;
    content_available?: boolean;
    category?: string;
    thread_id?: string;
}
interface WebpushConfig {
    headers?: Record<string, string>;
    notification?: WebpushNotification;
    data?: Record<string, string>;
    fcm_options?: { link?: string; analytics_label?: string; };
}
interface WebpushNotification {
    title?: string;
    body?: string;
    icon?: string;
    image?: string;
    tag?: string;
    actions?: { action: string; title: string; icon: string; }[];
}
interface FCMMessageFormProps { selectedProject: string | null; onSendMessage: (message: FcmMessageV1) => Promise<any>; }
// #endregion

const initialFormState: Message = { webpush: { notification: { actions: [] } } };

export const FCMMessageForm = ({ selectedProject, onSendMessage }: FCMMessageFormProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [targetType, setTargetType] = useState<"token" | "topic" | "condition">("token");
  const [formData, setFormData] = useState<Message>(initialFormState);
  const [customData, setCustomData] = useState<{ key: string; value: string }[]>([]);
  const [webActions, setWebActions] = useState<{ action: string; title: string; icon: string; }[]>([]);
  
  const [receivedJson, setReceivedJson] = useState<Record<string, unknown> | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleFormChange = useCallback((path: string, value: any) => {
    setFormData(produce(draft => {
      const keys = path.split('.');
      let current: any = draft;
      for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value === '' ? undefined : value;
    }));
  }, []);

  const finalMessage = useMemo((): FcmMessageV1 => {
    const pruneEmpty = (obj: any): any => {
        if (obj === null || obj === undefined) return undefined;
        if (Array.isArray(obj)) {
            const pruned = obj.map(pruneEmpty).filter(v => v !== undefined);
            return pruned.length > 0 ? pruned : undefined;
        }
        if (typeof obj === 'object') {
            const pruned = Object.entries(obj).reduce((acc, [key, value]) => {
                const prunedValue = pruneEmpty(value);
                if (prunedValue !== undefined) acc[key] = prunedValue;
                return acc;
            }, {} as { [key: string]: any });
            return Object.keys(pruned).length > 0 ? pruned : undefined;
        }
        return obj;
    };

    const message = pruneEmpty(formData) || {};
    if (targetType && message[targetType]) {
        if (targetType !== 'token') delete message.token;
        if (targetType !== 'topic') delete message.topic;
        if (targetType !== 'condition') delete message.condition;
    } else {
        delete message.token; delete message.topic; delete message.condition;
    }
    if (customData.length > 0) message.data = Object.fromEntries(customData.map(i => [i.key, i.value]));
    if (webActions.length > 0) {
        if (!message.webpush) message.webpush = {};
        if (!message.webpush.notification) message.webpush.notification = {};
        message.webpush.notification.actions = webActions;
    }

    return { message };
  }, [formData, targetType, customData, webActions]);

  const handleSendMessage = async () => {
    if (!selectedProject) { toast({ title: t('message.errors.noProject'), variant: "destructive" }); return; }
    const targetValue = formData[targetType];
    if (!targetValue || typeof targetValue !== 'string' || !targetValue.trim()) {
        toast({ title: t(`message.errors.no${targetType.charAt(0).toUpperCase() + targetType.slice(1)}`), variant: "destructive" });
        return;
    }
    setIsSending(true);
    setReceivedJson(null);
    try {
      const response = await onSendMessage(finalMessage);
      setReceivedJson(response);
      toast({ title: t('message.success.sent'), description: t('message.success.sentDescription', { project: selectedProject }) });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setReceivedJson({ error: errorMessage });
      toast({ title: t('message.errors.sendError'), description: errorMessage, variant: "destructive" });
    } finally { setIsSending(false); }
  };

  const addCustomData = () => {
    const key = (document.getElementById('customDataKey') as HTMLInputElement).value;
    const value = (document.getElementById('customDataValue') as HTMLInputElement).value;
    if (key.trim() && value.trim()) {
      setCustomData([...customData, { key, value }]);
      (document.getElementById('customDataKey') as HTMLInputElement).value = '';
      (document.getElementById('customDataValue') as HTMLInputElement).value = '';
    }
  };
  const removeCustomData = (index: number) => setCustomData(customData.filter((_, i) => i !== index));

  const addWebAction = () => {
    const action = { 
        action: (document.getElementById('webActionAction') as HTMLInputElement).value, 
        title: (document.getElementById('webActionTitle') as HTMLInputElement).value, 
        icon: (document.getElementById('webActionIcon') as HTMLInputElement).value 
    };
    if (action.action.trim() && action.title.trim()) {
        setWebActions([...webActions, action]);
        (document.getElementById('webActionAction') as HTMLInputElement).value = '';
        (document.getElementById('webActionTitle') as HTMLInputElement).value = '';
        (document.getElementById('webActionIcon') as HTMLInputElement).value = '';
    }
  };
  const removeWebAction = (index: number) => setWebActions(webActions.filter((_, i) => i !== index));

  const InfoTooltip = ({ children, contentKey }: { children: React.ReactNode, contentKey: string }) => (
    <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1 cursor-help">{children}<Info className="h-3 w-3 text-muted-foreground" /></div></TooltipTrigger><TooltipContent><p className="max-w-sm text-xs">{t(contentKey)}</p></TooltipContent></Tooltip>
  );

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" />{t('message.title')}{selectedProject && <Badge variant="secondary" className="ml-auto">{selectedProject}</Badge>}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('message.descriptionV1')}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>{t('message.target.title')} *</Label>
            <RadioGroup value={targetType} onValueChange={(v) => setTargetType(v as any)} className="flex space-x-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="token" id="token" /><Label htmlFor="token">{t('message.target.token')}</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="topic" id="topic" /><Label htmlFor="topic">{t('message.target.topic')}</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="condition" id="condition" /><Label htmlFor="condition">{t('message.target.condition')}</Label></div>
            </RadioGroup>
            <div className="space-y-2">
                <Label htmlFor={targetType}>{t(`message.${targetType}`)} *</Label>
              <Input id={targetType} placeholder={t(`message.${targetType}Placeholder`)} value={formData[targetType] || ''} onChange={(e) => handleFormChange(targetType, e.target.value)} className="font-mono text-sm" />
            </div>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">{t('message.tabs.general')}</TabsTrigger>
              <TabsTrigger value="data">{t('message.tabs.data')}</TabsTrigger>
              <TabsTrigger value="android">{t('message.tabs.android')}</TabsTrigger>
              <TabsTrigger value="apns">{t('message.tabs.apns')}</TabsTrigger>
              <TabsTrigger value="webpush">{t('message.tabs.webpush')}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
                <Card>
                    <CardHeader><CardTitle>{t('message.notification.title')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.notificationTitle"><Label>{t('message.notification.title')}</Label></InfoTooltip><Input placeholder="Notification title" value={formData.notification?.title || ''} onChange={e => handleFormChange('notification.title', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.notificationBody"><Label>{t('message.notification.body')}</Label></InfoTooltip><Textarea placeholder="Notification body" value={formData.notification?.body || ''} onChange={e => handleFormChange('notification.body', e.target.value)} /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>{t('message.fcm_options.title')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.analyticsLabel"><Label>{t('message.fcm_options.analytics_label')}</Label></InfoTooltip><Input placeholder="your_analytics_label" value={formData.fcm_options?.analytics_label || ''} onChange={e => handleFormChange('fcm_options.analytics_label', e.target.value)} /></div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-2"><Input id="customDataKey" placeholder={t('message.customData.key')} /><Input id="customDataValue" placeholder={t('message.customData.value')} /></div>
              <Button onClick={addCustomData} variant="outline" className="w-full"><Plus className="h-4 w-4 mr-2" />{t('message.customData.add')}</Button>
              <div className="space-y-2">{customData.length > 0 && <Label>Current Custom Data:</Label>}<div className="flex flex-wrap gap-2">{customData.map((item, index) => (<Badge key={index} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => removeCustomData(index)}>{item.key}: {item.value} <X className="h-3 w-3 ml-1" /></Badge>))}</div></div>
            </TabsContent>

            <TabsContent value="android" className="space-y-4 pt-4">
                <Card>
                    <CardHeader><CardTitle>{t('message.android.config.title')}</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.ttl"><Label>{t('message.android.config.ttl')}</Label></InfoTooltip><Input placeholder="3600s" value={formData.android?.ttl || ''} onChange={e => handleFormChange('android.ttl', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.priority"><Label>{t('message.android.config.priority')}</Label></InfoTooltip><Select value={formData.android?.priority} onValueChange={v => handleFormChange('android.priority', v === 'NONE' ? '' : v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="NONE">{t('message.none')}</SelectItem><SelectItem value="NORMAL">NORMAL</SelectItem><SelectItem value="HIGH">HIGH</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.collapse_key"><Label>{t('message.android.config.collapse_key')}</Label></InfoTooltip><Input placeholder="my_collapse_key" value={formData.android?.collapse_key || ''} onChange={e => handleFormChange('android.collapse_key', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.restricted_package_name"><Label>{t('message.android.config.restricted_package_name')}</Label></InfoTooltip><Input placeholder="com.example.app" value={formData.android?.restricted_package_name || ''} onChange={e => handleFormChange('android.restricted_package_name', e.target.value)} /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>{t('message.android.notification.title')}</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.title"><Label>{t('message.android.notification.titleLabel')}</Label></InfoTooltip><Input value={formData.android?.notification?.title || ''} onChange={e => handleFormChange('android.notification.title', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.body"><Label>{t('message.android.notification.body')}</Label></InfoTooltip><Input value={formData.android?.notification?.body || ''} onChange={e => handleFormChange('android.notification.body', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.icon"><Label>{t('message.android.notification.icon')}</Label></InfoTooltip><Input value={formData.android?.notification?.icon || ''} onChange={e => handleFormChange('android.notification.icon', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.color"><Label>{t('message.android.notification.color')}</Label></InfoTooltip><Input value={formData.android?.notification?.color || ''} onChange={e => handleFormChange('android.notification.color', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.sound"><Label>{t('message.android.notification.sound')}</Label></InfoTooltip><Input value={formData.android?.notification?.sound || ''} onChange={e => handleFormChange('android.notification.sound', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.tag"><Label>{t('message.android.notification.tag')}</Label></InfoTooltip><Input value={formData.android?.notification?.tag || ''} onChange={e => handleFormChange('android.notification.tag', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.click_action"><Label>{t('message.android.notification.click_action')}</Label></InfoTooltip><Input value={formData.android?.notification?.click_action || ''} onChange={e => handleFormChange('android.notification.click_action', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.channel_id"><Label>{t('message.android.notification.channel_id')}</Label></InfoTooltip><Input value={formData.android?.notification?.channel_id || ''} onChange={e => handleFormChange('android.notification.channel_id', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.ticker"><Label>{t('message.android.notification.ticker')}</Label></InfoTooltip><Input value={formData.android?.notification?.ticker || ''} onChange={e => handleFormChange('android.notification.ticker', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.image"><Label>{t('message.android.notification.image')}</Label></InfoTooltip><Input value={formData.android?.notification?.image || ''} onChange={e => handleFormChange('android.notification.image', e.target.value)} /></div>
                        <div className="flex items-center space-x-2"><Switch checked={formData.android?.notification?.sticky} onCheckedChange={v => handleFormChange('android.notification.sticky', v)} /><InfoTooltip contentKey="message.tooltips.android.notification.sticky"><Label>{t('message.android.notification.sticky')}</Label></InfoTooltip></div>
                        <div className="flex items-center space-x-2"><Switch checked={formData.android?.notification?.local_only} onCheckedChange={v => handleFormChange('android.notification.local_only', v)} /><InfoTooltip contentKey="message.tooltips.android.notification.local_only"><Label>{t('message.android.notification.local_only')}</Label></InfoTooltip></div>
                        <div className="flex items-center space-x-2"><Switch checked={formData.android?.notification?.default_sound} onCheckedChange={v => handleFormChange('android.notification.default_sound', v)} /><InfoTooltip contentKey="message.tooltips.android.notification.default_sound"><Label>{t('message.android.notification.default_sound')}</Label></InfoTooltip></div>
                        <div className="flex items-center space-x-2"><Switch checked={formData.android?.notification?.default_vibrate_timings} onCheckedChange={v => handleFormChange('android.notification.default_vibrate_timings', v)} /><InfoTooltip contentKey="message.tooltips.android.notification.default_vibrate_timings"><Label>{t('message.android.notification.default_vibrate_timings')}</Label></InfoTooltip></div>
                        <div className="flex items-center space-x-2"><Switch checked={formData.android?.notification?.default_light_settings} onCheckedChange={v => handleFormChange('android.notification.default_light_settings', v)} /><InfoTooltip contentKey="message.tooltips.android.notification.default_light_settings"><Label>{t('message.android.notification.default_light_settings')}</Label></InfoTooltip></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.visibility"><Label>{t('message.android.notification.visibility')}</Label></InfoTooltip><Select value={formData.android?.notification?.visibility} onValueChange={v => handleFormChange('android.notification.visibility', v === 'NONE' ? '' : v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="NONE">{t('message.none')}</SelectItem><SelectItem value="PRIVATE">PRIVATE</SelectItem><SelectItem value="PUBLIC">PUBLIC</SelectItem><SelectItem value="SECRET">SECRET</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.notification_priority"><Label>{t('message.android.notification.priority')}</Label></InfoTooltip><Select value={formData.android?.notification?.notification_priority} onValueChange={v => handleFormChange('android.notification.notification_priority', v === 'NONE' ? '' : v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="NONE">{t('message.none')}</SelectItem><SelectItem value="PRIORITY_MIN">MIN</SelectItem><SelectItem value="PRIORITY_LOW">LOW</SelectItem><SelectItem value="PRIORITY_DEFAULT">DEFAULT</SelectItem><SelectItem value="PRIORITY_HIGH">HIGH</SelectItem><SelectItem value="PRIORITY_MAX">MAX</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.android.notification.importance"><Label>{t('message.android.notification.importance')}</Label></InfoTooltip><Select value={formData.android?.notification?.importance} onValueChange={v => handleFormChange('android.notification.importance', v === 'NONE' ? '' : v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="NONE">{t('message.none')}</SelectItem><SelectItem value="IMPORTANCE_MIN">MIN</SelectItem><SelectItem value="IMPORTANCE_LOW">LOW</SelectItem><SelectItem value="IMPORTANCE_DEFAULT">DEFAULT</SelectItem><SelectItem value="IMPORTANCE_HIGH">HIGH</SelectItem></SelectContent></Select></div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="apns" className="space-y-4 pt-4">
                <Card>
                    <CardHeader><CardTitle>{t('message.apns.payload.title')}</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.apns.alert.title"><Label>{t('message.apns.payload.alert_title')}</Label></InfoTooltip><Input value={formData.apns?.payload?.aps?.alert?.title || ''} onChange={e => handleFormChange('apns.payload.aps.alert.title', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.apns.alert.body"><Label>{t('message.apns.payload.alert_body')}</Label></InfoTooltip><Input value={formData.apns?.payload?.aps?.alert?.body || ''} onChange={e => handleFormChange('apns.payload.aps.alert.body', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.apns.badge"><Label>{t('message.apns.payload.badge')}</Label></InfoTooltip><Input type="number" value={formData.apns?.payload?.aps?.badge || ''} onChange={e => handleFormChange('apns.payload.aps.badge', parseInt(e.target.value))} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.apns.sound"><Label>{t('message.apns.payload.sound')}</Label></InfoTooltip><Input value={formData.apns?.payload?.aps?.sound || ''} onChange={e => handleFormChange('apns.payload.aps.sound', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.apns.category"><Label>{t('message.apns.payload.category')}</Label></InfoTooltip><Input value={formData.apns?.payload?.aps?.category || ''} onChange={e => handleFormChange('apns.payload.aps.category', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.apns.thread_id"><Label>{t('message.apns.payload.thread_id')}</Label></InfoTooltip><Input value={formData.apns?.payload?.aps?.thread_id || ''} onChange={e => handleFormChange('apns.payload.aps.thread_id', e.target.value)} /></div>
                        <div className="flex items-center space-x-2"><Switch checked={formData.apns?.payload?.aps?.content_available} onCheckedChange={v => handleFormChange('apns.payload.aps.content_available', v)} /><InfoTooltip contentKey="message.tooltips.apns.content_available"><Label>{t('message.apns.payload.content_available')}</Label></InfoTooltip></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>{t('message.apns.fcm_options.title')}</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.apns.fcm_options.analytics_label"><Label>{t('message.apns.fcm_options.analytics_label')}</Label></InfoTooltip><Input value={formData.apns?.fcm_options?.analytics_label || ''} onChange={e => handleFormChange('apns.fcm_options.analytics_label', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.apns.fcm_options.image"><Label>{t('message.apns.fcm_options.image')}</Label></InfoTooltip><Input value={formData.apns?.fcm_options?.image || ''} onChange={e => handleFormChange('apns.fcm_options.image', e.target.value)} /></div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="webpush" className="space-y-4 pt-4">
                <Card>
                    <CardHeader><CardTitle>{t('message.webpush.notification.title')}</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.webpush.notification.title"><Label>{t('message.webpush.notification.titleLabel')}</Label></InfoTooltip><Input value={formData.webpush?.notification?.title || ''} onChange={e => handleFormChange('webpush.notification.title', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.webpush.notification.body"><Label>{t('message.webpush.notification.body')}</Label></InfoTooltip><Input value={formData.webpush?.notification?.body || ''} onChange={e => handleFormChange('webpush.notification.body', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.webpush.notification.icon"><Label>{t('message.webpush.notification.icon')}</Label></InfoTooltip><Input value={formData.webpush?.notification?.icon || ''} onChange={e => handleFormChange('webpush.notification.icon', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.webpush.notification.image"><Label>{t('message.webpush.notification.image')}</Label></InfoTooltip><Input value={formData.webpush?.notification?.image || ''} onChange={e => handleFormChange('webpush.notification.image', e.target.value)} /></div>
                        <div className="space-y-2"><InfoTooltip contentKey="message.tooltips.webpush.notification.tag"><Label>{t('message.webpush.notification.tag')}</Label></InfoTooltip><Input value={formData.webpush?.notification?.tag || ''} onChange={e => handleFormChange('webpush.notification.tag', e.target.value)} /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>{t('message.webActions.title')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 items-end">
                            <Input id="webActionAction" placeholder={t('message.webActions.actionPlaceholder')} />
                            <Input id="webActionTitle" placeholder={t('message.webActions.titlePlaceholder')} />
                            <Input id="webActionIcon" placeholder={t('message.webActions.iconPlaceholder')} />
                        </div>
                        <Button onClick={addWebAction} variant="outline" className="w-full"><Plus className="h-4 w-4 mr-2" />{t('message.webActions.add')}</Button>
                        <div className="space-y-2">
                            {webActions.map((action, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                    <div className="flex-grow grid grid-cols-3 gap-2">
                                        <p className="text-sm truncate"><b>{t('message.webActions.action')}:</b> {action.action}</p>
                                        <p className="text-sm truncate"><b>{t('message.webActions.titleLabel')}:</b> {action.title}</p>
                                        <p className="text-sm truncate"><b>{t('message.webActions.icon')}:</b> {action.icon}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeWebAction(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

          </Tabs>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t('message.jsonPreview.sent')}</CardTitle></CardHeader>
              <CardContent><pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-96 font-mono">{JSON.stringify(finalMessage, null, 2)}</pre></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t('message.jsonPreview.received')}</CardTitle></CardHeader>
              <CardContent><pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-96 font-mono">{receivedJson ? JSON.stringify(receivedJson, null, 2) : "No response yet..."}</pre></CardContent>
            </Card>
          </div>

          <Button onClick={handleSendMessage} disabled={!selectedProject || (formData[targetType] || '').trim() === '' || isSending} className="w-full" size="lg">
            {isSending ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />{t('message.sending')}</>) : (<><Send className="h-4 w-4 mr-2" />{t('message.send')}</>)}
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};