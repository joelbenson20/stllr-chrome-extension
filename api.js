export const BASE_URL = "http://107.170.16.225/";

export async function getCsrfToken() {
  try {
    const response = await fetch(`${BASE_URL}extension/csrf-token/`, {
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
        head: document.head.innerHTML,
        innerText: document.documentElement.innerText
      };
    },
  });

  return {
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl,
    head: result.head,
    innerText: result.innerText,
  };
}