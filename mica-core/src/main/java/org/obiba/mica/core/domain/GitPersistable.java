package org.obiba.mica.core.domain;

import java.io.Serializable;
import java.util.Map;

import org.springframework.data.domain.Persistable;

public interface GitPersistable extends Persistable<String>, Timestamped {

  String pathPrefix();

  Map<String, Serializable> parts();
}