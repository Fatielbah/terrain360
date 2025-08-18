package Pfe.T360.controller;

import Pfe.T360.service.FileService;
import Pfe.T360.service.MaterielService;
import Pfe.T360.service.NotificationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController
@RequestMapping("/api/image")  
public class TestCotroller {
    @Autowired
    private FileService fileService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
	private MaterielService materielService ;

    

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        try {
            String response = fileService.uploadFile(file);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Échec de l'upload du fichier: " + e.getMessage());
        }
    }

    @GetMapping("/download/{fileName}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable String fileName) {
        byte[] fileData = fileService.downloadFile(fileName);
        
        // Déterminez le type MIME dynamiquement
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM; // Type par défaut
        if (fileName.toLowerCase().endsWith(".png")) {
            mediaType = MediaType.IMAGE_PNG;
        } else if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) {
            mediaType = MediaType.IMAGE_JPEG;
        } else if (fileName.toLowerCase().endsWith(".pdf")) {
            mediaType = MediaType.APPLICATION_PDF;
        } else if (fileName.toLowerCase().endsWith(".docx")) {
            mediaType = MediaType.valueOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(fileData);
    }


@GetMapping("/test")
    public String test() {
        return "Hello World";
    }
}
