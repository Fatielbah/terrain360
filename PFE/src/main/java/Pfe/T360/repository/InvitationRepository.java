package Pfe.T360.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import Pfe.T360.entity.Invitation;
import java.util.List;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {
	List<Invitation> findByEvenementId(Long evenementId);
    List<Invitation> findByUtilisateurId(Long utilisateurId);
    List<Invitation> findByEvenementIdAndUtilisateurIsNotNull(Long evenementId);
    boolean existsByEvenementIdAndUtilisateurId(Long evenementId, Long utilisateurId);
    List<Invitation> findByEvenementIdAndUtilisateurIdIn(Long evenementId, List<Long> utilisateurIds);
    void deleteByEvenementIdAndUtilisateurIdIn(Long evenementId, List<Long> utilisateurIds);


}
