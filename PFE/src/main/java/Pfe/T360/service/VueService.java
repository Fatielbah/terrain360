package Pfe.T360.service;

import Pfe.T360.entity.Vue;

import java.util.List;

public interface VueService {
    Vue addVue(Long postId, Long utilisateurId);
    List<Vue> getVuesByPost(Long postId);
}
