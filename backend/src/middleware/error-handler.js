export function errorHandler(error, request, response, next) {
  if (error?.name === "ZodError") {
    return response.status(400).json({
      message: "Dados invalidos enviados para o servidor.",
      code: "VALIDATION_ERROR",
      details: error.issues || null
    });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return response.status(statusCode).json({
    message: error.message || "Erro interno do servidor.",
    code: error.code || null,
    details: error.details || null
  });
}
