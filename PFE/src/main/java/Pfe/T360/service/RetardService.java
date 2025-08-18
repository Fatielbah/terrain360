package Pfe.T360.service;

import java.util.List;

import Pfe.T360.entity.AlerteRetard;
import Pfe.T360.entity.Retard;
import Pfe.T360.entity.Utilisateur;

public interface RetardService {
	public Retard createRetard(Retard retard);
	public Retard updateRetardJustification(Long id, boolean justifie, String remarque);
	public List<AlerteRetard> getAlertesByUtilisateur(Utilisateur utilisateur);
	public List<Retard> getRetardsByUtilisateur(Utilisateur utilisateur);
	List<Retard> getAllRetards();
    List<AlerteRetard> getAllAlertes();
    void deleteRetard(Long id);
    Retard updateRetard(Long id, Retard retardDetails);
}
