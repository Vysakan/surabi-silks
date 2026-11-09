const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms));

export async function submitEnquiry(data) {
  await delay();
  return {
    success: true,
    message: 'Your enquiry has been recorded. Our team will get back to you within 24 hours.',
    referenceId: `ENQ-${Date.now().toString(36).toUpperCase()}`,
  };
}
