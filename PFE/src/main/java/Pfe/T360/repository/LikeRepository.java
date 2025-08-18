package Pfe.T360.repository;

import Pfe.T360.entity.Like;
import Pfe.T360.entity.Post;
import Pfe.T360.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByPostAndUtilisateur(Post post, Utilisateur utilisateur);
    long countByPost(Post post);
    List<Like> findByPost(Post post);
}
