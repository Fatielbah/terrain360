package Pfe.T360.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import Pfe.T360.dto.UtilisateurDTO;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.service.UtilisateurService;

import java.util.List;


@Service
public interface UtilisateurService   {

	List<Utilisateur> getAllUtilisateurs();
    Utilisateur getUtilisateurById(Long id);
    Utilisateur saveUtilisateur(Utilisateur utilisateur);
    Utilisateur updateUtilisateur(Utilisateur utilisateur);
    void deleteUtilisateur(Long id);
    //List<Utilisateur> getAllUtilisateursByService(Long id);
    void uploadImage(Long idUtilisateur, MultipartFile image);
    List<Utilisateur> getAllEnqueteurs();


}
