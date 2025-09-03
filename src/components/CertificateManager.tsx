import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

interface CertificateManagerProps {
  certificates: FirebaseCertificate[];
  selectedProject: string | null;
  onCertificatesChange: (certificates: FirebaseCertificate[]) => void;
  onProjectSelect: (projectId: string | null) => void;
}

export const CertificateManager = ({
  certificates,
  selectedProject,
  onCertificatesChange,
  onProjectSelect
}: CertificateManagerProps) => {
  const [certificateInput, setCertificateInput] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleAddCertificate = () => {
    try {
      const newCertificate = JSON.parse(certificateInput) as FirebaseCertificate;
      
      // Validate certificate structure
      if (!newCertificate.project_id || !newCertificate.private_key || !newCertificate.client_email) {
        throw new Error("Certificato non valido: mancano campi obbligatori");
      }

      // Check if project already exists
      if (certificates.find(cert => cert.project_id === newCertificate.project_id)) {
        throw new Error("Progetto già esistente");
      }

      onCertificatesChange([...certificates, newCertificate]);
      setCertificateInput("");
      
      toast({
        title: t('certificates.success.added'),
        description: `${t('certificates.success.added')} ${newCertificate.project_id}`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Formato JSON non valido",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCertificate = (projectId: string) => {
    onCertificatesChange(certificates.filter(cert => cert.project_id !== projectId));
    if (selectedProject === projectId) {
      onProjectSelect(null);
    }
    
    toast({
      title: t('certificates.success.deleted'),
      description: `${t('certificates.success.deleted')} ${projectId}`,
    });
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
                  Carica i certificati service account JSON di Firebase per abilitare l'invio di notifiche FCM
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Incolla JSON Certificato</label>
            <Textarea
              placeholder={`{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
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
              Aggiungi Certificato
            </Button>
          </div>

          {certificates.length > 0 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Certificati Caricati</label>
              
              {/* Lista certificati con pulsanti di rimozione */}
              <div className="space-y-2">
                {certificates.map((cert) => (
                  <div
                    key={cert.project_id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                      <span className="font-medium">{cert.project_id}</span>
                      {selectedProject === cert.project_id && (
                        <Badge variant="default" className="text-xs">Attivo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedProject !== cert.project_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onProjectSelect(cert.project_id)}
                          className="text-xs"
                        >
                          Seleziona
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCertificate(cert.project_id)}
                        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Seleziona Progetto Attivo</label>
                <Select value={selectedProject || ""} onValueChange={onProjectSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un progetto Firebase" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificates.map((cert) => (
                      <SelectItem key={cert.project_id} value={cert.project_id}>
                        {cert.project_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};