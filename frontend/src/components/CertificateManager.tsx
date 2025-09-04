import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { addCertificate, removeCertificate } from "../api";

interface CertificateManagerProps {
  projects: string[];
  selectedProject: string | null;
  onProjectSelect: (projectId: string | null) => void;
  onCertificateUpdate: () => void;
}

export const CertificateManager = ({
  projects,
  selectedProject,
  onProjectSelect,
  onCertificateUpdate
}: CertificateManagerProps) => {
  const [certificateInput, setCertificateInput] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleAddCertificate = async () => {
    try {
      const newCertificate = JSON.parse(certificateInput);
      
      if (!newCertificate.project_id || !newCertificate.private_key || !newCertificate.client_email) {
        throw new Error(t('certificates.errors.invalid'));
      }

      await addCertificate(newCertificate);

      setCertificateInput("");
      onCertificateUpdate();
      
      toast({
        title: t('certificates.success.added'),
        description: `${t('certificates.success.addedDescription')} ${newCertificate.project_id}`,
      });
    } catch (error) {
      toast({
        title: t('app.errors.title'),
        description: error instanceof Error ? error.message : t('certificates.errors.invalidJson'),
        variant: "destructive",
      });
    }
  };

  const handleRemoveCertificate = async (projectId: string) => {
    try {
      await removeCertificate(projectId);

      onCertificateUpdate();
      if (selectedProject === projectId) {
        onProjectSelect(null);
      }
      
      toast({
        title: t('certificates.success.deleted'),
        description: `${t('certificates.success.deletedDescription')} ${projectId}`,
      });
    } catch (error) {
      toast({
        title: t('app.errors.title'),
        description: error instanceof Error ? error.message : t('app.errors.generic'),
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {t('certificates.title')}
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {t('certificates.tooltip')}
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('certificates.pasteJson')}</label>
            <Textarea
              placeholder={`{
  "type": "service_account",
  "project_id": "your-project-id",
  ...
}`}
              value={certificateInput}
              onChange={(e) => setCertificateInput(e.target.value)}
              className="min-h-32 font-mono text-sm"
            />
            <Button 
              onClick={handleAddCertificate}
              disabled={!certificateInput.trim()}
              className="w-full"
            >
              {t('certificates.addBtn')}
            </Button>
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('certificates.uploaded')}</label>
              <div className="space-y-2">
                {projects.map((projectId) => (
                  <div
                    key={projectId}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border cursor-pointer hover:bg-muted"
                    onClick={() => onProjectSelect(projectId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${selectedProject === projectId ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
                      <span className="font-medium">{projectId}</span>
                      {selectedProject === projectId && (
                        <Badge variant="default" className="text-xs">{t('app.active')}</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleRemoveCertificate(projectId); }}
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};