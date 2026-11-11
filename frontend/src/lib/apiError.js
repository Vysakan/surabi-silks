/** The message to show for a failed request (API error, network problem or plain Error). */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const apiError = error?.response?.data?.error;
  if (apiError) {
    const details = Array.isArray(apiError.details) ? apiError.details : [];
    if (apiError.code === 'VALIDATION_ERROR' && details.length && (!apiError.message || apiError.message === 'Validation failed')) {
      const first = details[0];
      return first.path ? `${first.path}: ${first.message}` : first.message;
    }
    return apiError.message || fallback;
  }
  if (error?.response) return fallback;
  if (error?.isAxiosError || error?.request) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  return error?.message || fallback;
}

/** { fieldName: message } from a 400 VALIDATION_ERROR, for showing errors under the inputs. */
export function getFieldErrors(error) {
  const details = error?.response?.data?.error?.details;
  const out = {};
  if (Array.isArray(details)) {
    for (const d of details) {
      if (d?.path && !out[d.path]) out[d.path] = d.message;
    }
  }
  return out;
}
