package Pfe.T360.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import Pfe.T360.entity.Sondage;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.entity.Vote;

public interface VoteRepository extends JpaRepository<Vote, Long> {
	boolean existsByUtilisateurIdAndOptionSondageId(Long utilisateurId, Long sondageId);
	 Optional<Vote> findByUtilisateurAndSondage(Utilisateur utilisateur, Sondage sondage);

}
