package Pfe.T360.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import Pfe.T360.entity.FichePrime;

public interface FichePrimeService {
	void uploadFichePrime(Long idUtilisateur, MultipartFile fiche);
	public List<FichePrime> getAllFichesPrime() ;
	public List<FichePrime> getFichesPrimeByUtilisateur(Long idUtilisateur) ;
	byte[] downloadFichePrime(Long ficheId);
	FichePrime getFichePrimeById(Long ficheId);
}
