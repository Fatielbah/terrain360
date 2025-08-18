package Pfe.T360.exception;


public class GestionCongeException extends RuntimeException {
    
    // Constructeur de base
    public GestionCongeException(String message) {
        super(message);
    }
    
    // Constructeur avec cause
    public GestionCongeException(String message, Throwable cause) {
        super(message, cause);
    }
    
    // Optionnel : avec code d'erreur
    private String errorCode;
    
    public GestionCongeException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    
}
