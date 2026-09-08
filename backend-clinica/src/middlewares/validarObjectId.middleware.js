import mongoose from 'mongoose';

export const validarObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        mensaje: `El parámetro ${paramName} no es un ObjectId válido`
      });
    }

    next();
  };
};