export const fetchLogger = async (input: RequestInfo | URL, init?: RequestInit) => {
  const start = performance.now();
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  
  // Extract table from URL if it's Supabase (e.g. /rest/v1/products)
  let table = 'unknown';
  if (url.includes('/rest/v1/')) {
    table = url.split('/rest/v1/')[1]?.split('?')[0] || 'unknown';
  } else if (url.includes('/graphql/v1/')) {
    table = 'graphql';
  } else if (url.includes('/auth/v1/')) {
    table = 'auth';
  }

  const method = init?.method || 'GET';
  const queryParams = url.split('?')[1] || '';
  const bodyLog = init?.body && typeof init.body === 'string' && init.body.length < 500 ? init.body : '...';
  
  // Create a dedup key based on url + method + body snippet
  const dedup_key = `${method}:${url.split('?')[0]}?${queryParams}|body:${bodyLog.slice(0, 50)}`;

  // Capture stack trace to estimate component/hook caller
  const stack = new Error().stack;
  let callerContext = 'unknown';
  if (stack) {
    const stackLines = stack.split('\n');
    // Find the first line that is not inside utils/fetchLogger or node_modules/cross-fetch etc
    const callerLine = stackLines.find(line => !line.includes('fetchLogger') && !line.includes('node_modules') && !line.includes('supabase-js'));
    if (callerLine) {
      // E.g. "at MyComponent (webpack-internal:///./src/components/MyComponent.tsx:10:15)"
      callerContext = callerLine.trim();
    }
  }

  // Print request start (optional, could just do end)
  // console.log(`[FETCH] -> ${method} /${table}`);

  try {
    const response = await fetch(input, init);
    const duration = (performance.now() - start).toFixed(2);
    
    console.log(
      `[FETCH_LOGGER]`,
      `Table: ${table} |`,
      `Context: ${callerContext} |`,
      `Duration: ${duration}ms |`,
      `Status: ${response.status} |`,
      `Method: ${method} |`,
      `DedupKey: ${dedup_key}`
    );
    
    return response;
  } catch (error) {
    const duration = (performance.now() - start).toFixed(2);
    console.error(
      `[FETCH_LOGGER] ERROR`,
      `Table: ${table} |`,
      `Context: ${callerContext} |`,
      `Duration: ${duration}ms |`,
      error
    );
    throw error;
  }
};
