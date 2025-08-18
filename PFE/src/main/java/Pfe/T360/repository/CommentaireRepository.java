package Pfe.T360.repository;


import Pfe.T360.entity.Commentaire;
import Pfe.T360.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {
    List<Commentaire> findByPost(Post post);
}
