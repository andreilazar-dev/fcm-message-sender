import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CertificateManager } from "@/components/CertificateManager";
import { FCMMessageForm } from "@/components/FCMMessageForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Zap, Shield, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FirebaseCertificate {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

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
  data: Record<string, string>;
  android: {
    notification: {
      sound?: string;
      color?: string;
      tag?: string;
      priority?: string;
    };
  };
  webpush: {
    notification: {
      requireInteraction?: boolean;
      vibrate?: number[];
    };
  };
}

const Index = () => {
  const [certificates, setCertificates] = useState<FirebaseCertificate[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Load certificates from localStorage on mount
  useEffect(() => {
    const savedCertificates = localStorage.getItem("fcm-certificates");
    if (savedCertificates) {
      try {
        const parsed = JSON.parse(savedCertificates);
        setCertificates(parsed);
      } catch (error) {
        console.error("Error loading certificates:", error);
      }
    }
  }, []);

  // Save certificates to localStorage when they change
  useEffect(() => {
    localStorage.setItem("fcm-certificates", JSON.stringify(certificates));
  }, [certificates]);

  const handleSendMessage = async (message: FCMMessage) => {
    const selectedCert = certificates.find(cert => cert.project_id === selectedProject);
    
    if (!selectedCert) {
      toast({
        title: t('message.errors.certificateNotFound'),
        variant: "destructive"
      });
      return;
    }

    try {
      // In a real implementation, this would make an API call to your backend
      // that uses the Firebase Admin SDK to send the message
      console.log("Sending FCM message:", {
        projectId: selectedProject,
        message
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t('message.success.sent'),
        description: t('message.success.sentDescription', { project: selectedProject }),
      });
      
    } catch (error) {
      toast({
        title: t('message.errors.sendError'),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
          </div>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            {t('app.description')}
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              {t('app.features.quickSend')}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              {t('app.features.secure')}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Smartphone className="h-3 w-3" />
              {t('app.features.multiPlatform')}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quick Stats */}
          {certificates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('app.stats.projectsConfigured')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {certificates.length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('app.stats.activeProject')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold truncate">
                    {selectedProject || t('app.stats.none')}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('app.stats.status')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={selectedProject ? "default" : "secondary"}>
                    {selectedProject ? t('app.stats.ready') : t('app.stats.configuring')}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Certificate Manager */}
          <CertificateManager
            certificates={certificates}
            selectedProject={selectedProject}
            onCertificatesChange={setCertificates}
            onProjectSelect={setSelectedProject}
          />

          {/* FCM Message Form */}
          <FCMMessageForm
            selectedProject={selectedProject}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('app.footer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;