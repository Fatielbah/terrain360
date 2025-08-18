package Pfe.T360.repository;

import Pfe.T360.entity.Vue;
import Pfe.T360.entity.Post;
import Pfe.T360.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VueRepository extends JpaRepository<Vue, Long> {
    Optional<Vue> findByPostAndUtilisateur(Post post, Utilisateur utilisateur);
    List<Vue> findByPost(Post post);
}
