package Pfe.T360.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import Pfe.T360.entity.Role;
import Pfe.T360.entity.Utilisateur;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByNomDeUtilisateur(String nomDeUtilisateur);
    boolean existsByNomDeUtilisateur(String NomDeUtilisateur);
    @Query("SELECT u FROM Utilisateur u WHERE SIZE(u.affectations) > 0")
    List<Utilisateur> findUtilisateursAvecMateriels();
    
    List<Utilisateur> findByRole(Role role);
    
    List<Utilisateur> findByServiceId(Long serviceId);
	List<Utilisateur> findByServiceIdIn(List<Long> serviceIds);
	
}
