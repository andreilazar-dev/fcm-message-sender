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

  let result;
  try {
    result = await response.json();
  } catch (e) {
    // If JSON parsing fails, or response is not JSON, throw an error
    throw new Error(`Failed to parse response from server. Status: ${response.status}. Error: ${e.message}`);
  }

  if (!response.ok || !result.success) {
    // If HTTP response is not OK, or backend indicates application-level error
    throw new Error(result.error || `Failed to send message. Status: ${response.status}.`);
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
