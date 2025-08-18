package Pfe.T360.service.impl;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import Pfe.T360.dto.UtilisateurDTO;
import Pfe.T360.entity.File;
import Pfe.T360.entity.Role;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.FileRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.UtilisateurService;
import Pfe.T360.util.FileUtils;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class UtilisateurServiceImpl implements UtilisateurService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private FileRepository fileRepository;
    @Override
    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurRepository.findAll();
    }
    /*@Override
	public List<Utilisateur> getAllUtilisateursByService(Long id) {
		// TODO Auto-generated method stub
		return utilisateurRepository.findByServiceId(id);
	}*/
    @Override
    public List<Utilisateur> getAllEnqueteurs(){
    	return utilisateurRepository.findByRole(Role.ENQUETEUR);
    }
    @Override
    public Utilisateur getUtilisateurById(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable avec l'ID : " + id));
    }

    @Override
    public Utilisateur saveUtilisateur(Utilisateur utilisateur) {
        // Encoder le mot de passe avant de l'enregistrer
        utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
        return utilisateurRepository.save(utilisateur);
    }

    @Override
    public Utilisateur updateUtilisateur(Utilisateur utilisateur) {
        if (!utilisateurRepository.existsById(utilisateur.getId())) {
            throw new RuntimeException("Utilisateur introuvable pour la mise à jour !");
        }
        // Vous pouvez aussi encoder à nouveau le mot de passe en cas de modification
        if (utilisateur.getMotDePasse() != null) {
            utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
        }
        return utilisateurRepository.save(utilisateur);
    }
    
    
    @Override
    public void uploadImage(Long idUtilisateur, MultipartFile image) {
        Optional<Utilisateur> optionalUtilisateur = utilisateurRepository.findById(idUtilisateur);
        if (optionalUtilisateur.isEmpty()) {
            throw new RuntimeException("Utilisateur introuvable !");
        }
        
        Utilisateur utilisateur = optionalUtilisateur.get();
        
        if (image != null && !image.isEmpty()) {
            try {
                // Delete previous image if exists
                if (utilisateur.getImage() != null) {
                    fileRepository.delete(utilisateur.getImage());
                }
                
                File imageFile = File.builder()
                        .name(image.getOriginalFilename())
                        .type(image.getContentType())
                        .fileData(FileUtils.compressFile(image.getBytes()))
                        .build();
                
                // Save the image file first
                imageFile = fileRepository.save(imageFile);
                utilisateur.setImage(imageFile);
                utilisateurRepository.save(utilisateur);
                
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de la lecture du fichier image", e);
            }
        }
    }
    @Override
    public void deleteUtilisateur(Long id) {
        if (!utilisateurRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur introuvable pour la suppression !");
        }
        utilisateurRepository.deleteById(id);
    }

	
   

	

	
}
