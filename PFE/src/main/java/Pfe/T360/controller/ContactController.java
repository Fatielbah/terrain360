package Pfe.T360.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Pfe.T360.dto.ContactFormDTO;
@RestController
@RequestMapping("/api/contact")
public class ContactController {

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping
    public ResponseEntity<String> envoyerMessage(@RequestBody ContactFormDTO form) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo("useruse928@gmail.com");
            message.setSubject("Nouveau message de contact");
            message.setText(
                "Nom: " + form.getNom() + " Prénom: " + form.getPrenom() + "\n" +
                "Email: " + form.getEmail() + "\n" +
                "Téléphone: "+form.getTel()	 + "\n\n" +	
                "Message:\n" + form.getMessage()
            );

            mailSender.send(message);
            return ResponseEntity.ok("Message envoyé avec succès !");
        } catch (Exception e) {
            e.printStackTrace(); // AJOUTE ÇA POUR VOIR LE DÉTAIL DE L'ERREUR
            return ResponseEntity.status(500).body("Erreur lors de l'envoi du message.");
        }
    }

}
