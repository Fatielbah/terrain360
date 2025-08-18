package Pfe.T360.service.impl;

import Pfe.T360.entity.Vue;
import Pfe.T360.entity.Post;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.VueRepository;
import Pfe.T360.repository.PostRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.VueService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VueServiceImpl implements VueService {

    private final VueRepository vueRepository;
    private final PostRepository postRepository;
    private final UtilisateurRepository utilisateurRepository;

    public VueServiceImpl(VueRepository vueRepository, PostRepository postRepository, UtilisateurRepository utilisateurRepository) {
        this.vueRepository = vueRepository;
        this.postRepository = postRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public Vue addVue(Long postId, Long utilisateurId) {
        Post post = postRepository.findById(postId).orElseThrow();
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElseThrow();

        return vueRepository.findByPostAndUtilisateur(post, utilisateur)
                .orElseGet(() -> {
                    Vue vue = new Vue();
                    vue.setPost(post);
                    vue.setUtilisateur(utilisateur);
                    vue.setDate(LocalDateTime.now());
                    return vueRepository.save(vue);
                });
    }

    @Override
    public List<Vue> getVuesByPost(Long postId) {
        Post post = postRepository.findById(postId).orElseThrow();
        return vueRepository.findByPost(post);
    }
}
