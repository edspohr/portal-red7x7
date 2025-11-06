const errorHandler = (err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  const details = err.details || undefined;

  res.status(status).json({
    status: 'error',
    message,
    details,
  });
};

export default errorHandler;
