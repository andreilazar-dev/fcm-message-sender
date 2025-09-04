const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const fetchProjects = async () => {
  const response = await fetch(`${API_BASE_URL}/api/projects`);
  if (!response.ok) {
    throw new Error('Failed to fetch projects from backend');
  }
  const data = await response.json();
  return data.projects || [];
};

export const sendMessage = async (projectId: string, message: Record<string, any>) => {
  const response = await fetch(`${API_BASE_URL}/api/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ projectId, message }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to send message");
  }

  return result.response;
};

export const addCertificate = async (certificate: Record<string, any>) => {
  const response = await fetch(`${API_BASE_URL}/api/certificates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(certificate),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add certificate");
  }

  return response.json();
};

export const removeCertificate = async (projectId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/certificates/${projectId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete certificate");
  }

  return response.json();
};
