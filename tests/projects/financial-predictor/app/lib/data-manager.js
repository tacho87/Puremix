import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelsDir = path.join(__dirname, '../models');

export class DataManager {
  static async readData(filename) {
    try {
      const filePath = path.join(modelsDir, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return [];
    }
  }

  static async writeData(filename, data) {
    try {
      const filePath = path.join(modelsDir, filename);
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, jsonData, 'utf-8');

      // Create backup
      const backupPath = path.join(modelsDir, `backups`, `${filename}.backup.${Date.now()}`);
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.writeFile(backupPath, jsonData, 'utf-8');

      return { success: true };
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      return { success: false, error: error.message };
    }
  }

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static async addRecord(filename, record) {
    const data = await this.readData(filename);
    const newRecord = { id: this.generateId(), ...record, createdAt: new Date().toISOString() };
    data.push(newRecord);
    const result = await this.writeData(filename, data);
    return { success: result.success, record: newRecord };
  }

  static async updateRecord(filename, id, updates) {
    const data = await this.readData(filename);
    const index = data.findIndex(record => record.id === id);

    if (index === -1) {
      return { success: false, error: 'Record not found' };
    }

    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const result = await this.writeData(filename, data);
    return { success: result.success, record: data[index] };
  }

  static async deleteRecord(filename, id) {
    const data = await this.readData(filename);
    const filteredData = data.filter(record => record.id !== id);

    if (filteredData.length === data.length) {
      return { success: false, error: 'Record not found' };
    }

    const result = await this.writeData(filename, filteredData);
    return { success: result.success };
  }

  static async getRecord(filename, id) {
    const data = await this.readData(filename);
    const record = data.find(record => record.id === id);
    return record || null;
  }

  static async savePrediction(predictionData) {
    const predictions = await this.readData('predictions.json') || [];
    const newPrediction = {
      id: this.generateId(),
      ...predictionData,
      timestamp: new Date().toISOString()
    };
    predictions.push(newPrediction);

    // Keep only last 100 predictions
    if (predictions.length > 100) {
      predictions.splice(0, predictions.length - 100);
    }

    return await this.writeData('predictions.json', predictions);
  }

  static async getPredictionHistory(limit = 10) {
    const predictions = await this.readData('predictions.json') || [];
    return predictions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  static async searchRecords(filename, query) {
    const data = await this.readData(filename);
    const results = data.filter(record => {
      return Object.values(record).some(value =>
        value && value.toString().toLowerCase().includes(query.toLowerCase())
      );
    });
    return results;
  }
}