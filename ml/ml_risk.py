import pickle
import tempfile
import numpy as np
import matplotlib.pyplot as plt
import random

from sklearn import tree
from sklearn.metrics import accuracy_score
import sys


def train():
    # Load Data
    filename = 'ml1.csv'
    data = np.loadtxt(filename, delimiter=',')
    X = data[:, 1:3]
    y = np.array([data[:, 0]]).T
    n, d = X.shape
    performs_normal = []
    performs_stump = []
    performs_3level = []

    # shuffle the data
    idx = np.arange(n)
    np.random.seed(13)
    np.random.shuffle(idx)
    X = X[idx]
    y = y[idx]

    # train the decision tree
    clf = tree.DecisionTreeClassifier()
    clf = clf.fit(X, y)
    return clf


def predict(model, x):
    return model.predict(x)


clf = None
try:
    with open('clf.pickle', 'rb') as f:  # Python 3: open(..., 'rb')
        clf = pickle.load(f)[0]
except:
    pass

if not clf:
    clf = train()
    with open('clf.pickle', 'wb') as f:
        pickle.dump([clf], f)


if len(sys.argv) >= 3:
    x = sys.argv[1:]
    x = [[int(x[0]), int(x[1])]]
    f = open('risk.dat','w')
    p = predict(clf, x)
    f.write(str(p[0]))
    f.close()