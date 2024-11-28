// middleware/index.mjs  
export { errorHandler } from './errorHandler.mjs';

// You can add other middleware exports here  
export const asyncHandler = (fn) => (req, res, next) =>  
  Promise.resolve(fn(req, res, next)).catch(next);

export const errorResponse = (res, status, message) => {  
  return res.status(status).json({   
    success: false,  
    message   
  });  
};  