function requestLogger(req, res, next) {
  const start = Date.now();
  const delivery = req.headers['x-github-delivery'];
  const event = req.headers['x-github-event'];
  
  res.on('finish', () => {
    const ms = Date.now() - start;
    const logInfo = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`;
    const deliveryInfo = delivery ? ` delivery=${delivery}` : '';
    const eventInfo = event ? ` event=${event}` : '';
    
    console.info(`${logInfo}${deliveryInfo}${eventInfo}`);
  });
  
  next();
}

export default requestLogger;