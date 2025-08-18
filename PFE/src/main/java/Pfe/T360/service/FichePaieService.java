package Pfe.T360.service;

import org.springframework.web.multipart.MultipartFile;
import Pfe.T360.entity.FichePaie;
import java.util.List;
public interface FichePaieService {
	void uploadFichePaie(Long idUtilisateur, MultipartFile fiche);
	public List<FichePaie> getFichesPaieByUtilisateur(Long idUtilisateur) ;

	public List<FichePaie> getAllFichesPaie();
	byte[] downloadFichePaie(Long ficheId);
	FichePaie getFichePaieById(Long ficheId);
	
}
