export const FLOAT_API_URL = "http://127.0.0.1:8000/extension";

export async function getCsrfToken() {
  try {
    const response = await fetch(`${FLOAT_API_URL}/csrf-token/`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return null;
  }
}

export async function getPageData() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const readMeta = (property) =>
        document.querySelector(`meta[property="${property}"]`)?.content ||
        document.querySelector(`meta[name="${property}"]`)?.content ||
        null;

      return {
        description: readMeta("og:description") || null,
        imageUrl: readMeta("og:image") || null,
        siteName: readMeta("og:site_name") || null,
      };
    },
  });

  return {
    url: tab.url,
    title: tab.title,
    description: result.description,
    imageUrl: result.imageUrl,
    siteName: result.siteName,
    favIconUrl: tab.favIconUrl,
  };
}