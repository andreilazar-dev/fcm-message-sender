import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CertificateManager } from "@/components/CertificateManager";
import packageJson from '../../package.json';
import { FCMMessageForm } from "@/components/FCMMessageForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Zap, Shield, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchProjects, sendMessage } from "../api";

// The FCMMessage interface is now defined within FCMMessageForm.tsx
// We only need a generic object for the send function.

const Index = () => {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const loadProjects = useCallback(async () => {
    try {
      const fetchedProjects = await fetchProjects();
      setProjects(fetchedProjects);
      
      // If there's no selected project or the selected one was deleted, select the first available.
      if (fetchedProjects.length > 0 && !fetchedProjects.includes(selectedProject || '')) {
        setSelectedProject(fetchedProjects[0]);
      } else if (fetchedProjects.length === 0) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: t('app.errors.title'),
        description: error instanceof Error ? error.message : t('app.errors.generic'),
        variant: "destructive",
      });
    }
  }, [toast, t, selectedProject]);

  // Load projects from the backend on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSendMessage = async (message: Record<string, any>) => {
    if (!selectedProject) {
      toast({ title: t('message.errors.noProject'), variant: "destructive" });
      return;
    }
    
    try {
      await sendMessage(selectedProject, message);
      
      toast({
        title: t('message.success.sent'),
        description: t('message.success.sentDescription', { project: selectedProject })
      });

    } catch (error) {
      toast({
        title: t('app.errors.title'),
        description: error instanceof Error ? error.message : t('app.errors.generic'),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

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

        <div className="max-w-4xl mx-auto space-y-6">
          {projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('app.stats.projectsConfigured')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {projects.length}
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

          <CertificateManager
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={setSelectedProject}
            onCertificateUpdate={loadProjects}
          />

          <FCMMessageForm
            selectedProject={selectedProject}
            onSendMessage={handleSendMessage}
          />
        </div>

        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('app.footer')} <span className="text-xs opacity-50">(v{packageJson.version})</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;