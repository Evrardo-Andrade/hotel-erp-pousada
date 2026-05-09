export function errorHandler(error, request, response, next) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return response.status(statusCode).json({
    message: error.message || "Erro interno do servidor.",
    details: error.details || null
  });
}
